import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const memberId = getRouterParam(event, 'memberId')!
  const { membership } = await requireWorkspaceRole(event, workspaceId, 'admin')

  const supabase = serverSupabaseServiceRole(event)

  const { data: target } = await supabase
    .from('workspace_members')
    .select('id, role')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!target) throw createError({ statusCode: 404, message: 'Member not found' })

  // Only superadmins can remove owners
  if (target.role === 'owner' && membership.role !== 'superadmin') {
    throw createError({ statusCode: 403, message: 'Cannot remove workspace owner' })
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)

  if (error) throw createError({ statusCode: 500, message: 'Error removing member' })
  return { success: true }
})
