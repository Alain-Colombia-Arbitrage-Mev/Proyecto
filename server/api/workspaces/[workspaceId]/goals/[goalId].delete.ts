import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const goalId = getRouterParam(event, 'goalId')!
  await requirePermission(event, workspaceId, 'manage_goals')

  const supabase = serverSupabaseServiceRole(event)

  // Verify goal belongs to this workspace
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!goal) throw createError({ statusCode: 404, message: 'Goal not found in this workspace' })

  // Delete cascading goal_links first (in case FK cascade is not set at DB level)
  const { error: linksErr } = await supabase
    .from('goal_links')
    .delete()
    .eq('goal_id', goalId)

  if (linksErr) {
    console.error('[goals.delete] error deleting goal_links:', linksErr.message, linksErr.details)
    throw createError({ statusCode: 500, message: 'Error deleting goal links' })
  }

  // Delete the goal itself
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)

  if (error) {
    console.error('[goals.delete] delete error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error deleting goal' })
  }

  return { success: true }
})
