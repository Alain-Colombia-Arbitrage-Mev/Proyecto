import { serverSupabaseServiceRole } from '#supabase/server'
import { ROLE_LEVELS } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const entryId     = getRouterParam(event, 'entryId')!

  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Request body is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Fetch existing entry to enforce ownership and provide start_time for duration calc
  const { data: existing, error: fetchErr } = await supabase
    .from('time_entries')
    .select('id, user_id, workspace_id, start_time')
    .eq('id', entryId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchErr) {
    console.error('[time-entries.patch] fetch error:', fetchErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching time entry' })
  }

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Time entry not found' })
  }

  // Only the entry owner OR admin+ may edit
  const isAdmin = (ROLE_LEVELS[membership.role] ?? 0) >= ROLE_LEVELS.admin!
  if (existing.user_id !== user.id && !isAdmin) {
    throw createError({ statusCode: 403, message: 'You do not have permission to edit this entry' })
  }

  // Build the update payload from allowed fields only
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body.description === 'string')      patch.description = body.description.trim()
  if (typeof body.billable    === 'boolean')      patch.billable    = body.billable
  if (body.task_id    !== undefined)              patch.task_id     = body.task_id
  if (body.project_id !== undefined)              patch.project_id  = body.project_id

  // Handle end_time / duration_minutes
  if (body.end_time !== undefined) {
    const endTime: string = body.end_time

    // Validate format
    const tsPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
    if (!tsPattern.test(endTime)) {
      throw createError({ statusCode: 400, message: 'end_time must be an ISO 8601 timestamp' })
    }

    patch.end_time = endTime

    // Auto-calculate duration when we have a known start_time
    if (existing.start_time) {
      const startMs = new Date(existing.start_time).getTime()
      const endMs   = new Date(endTime).getTime()

      if (endMs <= startMs) {
        throw createError({ statusCode: 400, message: 'end_time must be after start_time' })
      }

      // Caller-provided duration_minutes takes precedence over the auto-calculated value
      if (typeof body.duration_minutes === 'number') {
        patch.duration_minutes = body.duration_minutes
      } else {
        patch.duration_minutes = Math.round((endMs - startMs) / 60_000)
      }
    }
  } else if (typeof body.duration_minutes === 'number') {
    // Explicit duration override without changing end_time
    patch.duration_minutes = body.duration_minutes
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update(patch)
    .eq('id', entryId)
    .select()
    .single()

  if (error) {
    console.error('[time-entries.patch] update error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error updating time entry' })
  }

  return data
})
