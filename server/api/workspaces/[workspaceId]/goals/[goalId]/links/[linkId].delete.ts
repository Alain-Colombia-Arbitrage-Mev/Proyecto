import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const goalId = getRouterParam(event, 'goalId')!
  const linkId = getRouterParam(event, 'linkId')!
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

  // Verify the link belongs to this goal
  const { data: link } = await supabase
    .from('goal_links')
    .select('id')
    .eq('id', linkId)
    .eq('goal_id', goalId)
    .maybeSingle()

  if (!link) throw createError({ statusCode: 404, message: 'Goal link not found' })

  const { error } = await supabase
    .from('goal_links')
    .delete()
    .eq('id', linkId)

  if (error) {
    console.error('[goal-links.delete] delete error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error deleting goal link' })
  }

  return { success: true }
})
