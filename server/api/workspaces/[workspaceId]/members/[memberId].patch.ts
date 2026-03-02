import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const memberId = getRouterParam(event, 'memberId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const validRoles = ['viewer', 'member', 'admin']
  if (!body.role || !validRoles.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Invalid role. Allowed: viewer, member, admin' })
  }

  // Cannot change owner's role
  const { data: target } = await supabase
    .from('workspace_members')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!target) throw createError({ statusCode: 404, message: 'Member not found' })
  if (target.role === 'owner') throw createError({ statusCode: 403, message: 'Cannot change workspace owner role' })

  const { data: updated, error } = await supabase
    .from('workspace_members')
    .update({ role: body.role })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error updating member role' })
  return updated
})
