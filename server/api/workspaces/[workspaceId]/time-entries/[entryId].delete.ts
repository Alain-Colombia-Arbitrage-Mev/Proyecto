import { serverSupabaseServiceRole } from '#supabase/server'
import { ROLE_LEVELS } from '~~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const entryId     = getRouterParam(event, 'entryId')!

  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Fetch entry to verify ownership before deleting
  const { data: existing, error: fetchErr } = await supabase
    .from('time_entries')
    .select('id, user_id, workspace_id')
    .eq('id', entryId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchErr) {
    console.error('[time-entries.delete] fetch error:', fetchErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching time entry' })
  }

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Time entry not found' })
  }

  // Only the entry owner OR admin+ may delete
  const isAdmin = (ROLE_LEVELS[membership.role] ?? 0) >= ROLE_LEVELS.admin!
  if (existing.user_id !== user.id && !isAdmin) {
    throw createError({ statusCode: 403, message: 'You do not have permission to delete this entry' })
  }

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    console.error('[time-entries.delete] delete error:', error.message, error.details)
    throw createError({ statusCode: 500, message: 'Error deleting time entry' })
  }

  return { success: true }
})
