import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const dateId = getRouterParam(event, 'dateId')!
  const { user } = await requirePermission(event, workspaceId, 'manage_reserved_dates')

  const supabase = serverSupabaseServiceRole(event)

  // Only allow deleting own reserved dates (unless admin+)
  const { data: existing } = await supabase
    .from('reserved_dates')
    .select('user_id')
    .eq('id', dateId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Reserved date not found' })
  }

  if (existing.user_id !== user.id) {
    throw createError({ statusCode: 403, message: 'Can only delete your own reserved dates' })
  }

  const { error } = await supabase
    .from('reserved_dates')
    .delete()
    .eq('id', dateId)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('[reserved-dates.delete] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error deleting reserved date' })
  }

  return { success: true }
})
