import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const taskId = getRouterParam(event, 'taskId')!
  const body = await readBody(event)
  const durationMinutes = typeof body?.duration_minutes === 'number' ? body.duration_minutes : 25

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, tracked_hours, projects!inner(workspace_id)')
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

  return updated
})
