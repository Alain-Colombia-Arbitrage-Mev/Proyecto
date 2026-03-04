import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)

  // start_time is required
  if (!body?.start_time) {
    throw createError({ statusCode: 400, message: 'start_time is required' })
  }

  const startTime: string = body.start_time
  const endTime: string | undefined = body.end_time || undefined

  // Validate ISO timestamp format (basic guard)
  const tsPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
  if (!tsPattern.test(startTime)) {
    throw createError({ statusCode: 400, message: 'start_time must be an ISO 8601 timestamp' })
  }
  if (endTime && !tsPattern.test(endTime)) {
    throw createError({ statusCode: 400, message: 'end_time must be an ISO 8601 timestamp' })
  }

  // Reject timers running backwards
  if (endTime && new Date(endTime) <= new Date(startTime)) {
    throw createError({ statusCode: 400, message: 'end_time must be after start_time' })
  }

  // Compute duration when end_time is supplied
  let durationMinutes: number | null = null
  if (endTime) {
    const provided = typeof body.duration_minutes === 'number' ? body.duration_minutes : null
    if (provided !== null) {
      durationMinutes = provided
    } else {
      durationMinutes = Math.round(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60_000,
      )
    }
  }

  const payload: Record<string, unknown> = {
    workspace_id:     workspaceId,
    user_id:          user.id,
    start_time:       startTime,
    end_time:         endTime ?? null,
    duration_minutes: durationMinutes,
    description:      typeof body.description === 'string' ? body.description.trim() : null,
    billable:         typeof body.billable === 'boolean' ? body.billable : false,
    source:           typeof body.source === 'string' ? body.source : 'manual',
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }

  if (body.task_id)    payload.task_id    = body.task_id
  if (body.project_id) payload.project_id = body.project_id

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('time_entries')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[time-entries.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error creating time entry' })
  }

  return data
})
