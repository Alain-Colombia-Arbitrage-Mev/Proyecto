import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceRole(event, workspaceId, 'member')

  const taskId = getRouterParam(event, 'taskId')!
  const body = await readBody(event)
  const durationMinutes = typeof body?.duration_minutes === 'number' ? body.duration_minutes : 25

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, tracked_hours, project_id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task || (task as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  const currentHours = (task as any).tracked_hours || 0
  const increment = durationMinutes / 60

  const { data: updated, error } = await supabase
    .from('tasks')
    .update({
      tracked_hours: currentHours + increment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('[pomodoro.post] Update error:', error.message)
    throw createError({ statusCode: 500, message: 'Error registering pomodoro session' })
  }

  // Record a time_entries row so pomodoro sessions appear in timesheets.
  // We do this after the task update succeeds so a time_entries failure
  // does not roll back the tracked_hours increment.
  const endTime   = new Date()
  const startTime = new Date(endTime.getTime() - durationMinutes * 60_000)

  const timeEntryPayload: Record<string, unknown> = {
    workspace_id:     workspaceId,
    user_id:          user.id,
    task_id:          taskId,
    start_time:       startTime.toISOString(),
    end_time:         endTime.toISOString(),
    duration_minutes: durationMinutes,
    description:      `Pomodoro session (${durationMinutes} min)`,
    billable:         false,
    source:           'pomodoro',
    created_at:       endTime.toISOString(),
    updated_at:       endTime.toISOString(),
  }

  if ((task as any).project_id) {
    timeEntryPayload.project_id = (task as any).project_id
  }

  const { error: teError } = await supabase
    .from('time_entries')
    .insert(timeEntryPayload)

  if (teError) {
    // Non-fatal: log and continue — tracked_hours already updated
    console.error('[pomodoro.post] time_entries insert error:', teError.message, teError.details, teError.hint)
  }

  return updated
})
