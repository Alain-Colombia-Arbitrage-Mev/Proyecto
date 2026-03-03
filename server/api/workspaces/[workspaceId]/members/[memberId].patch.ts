import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const memberId = getRouterParam(event, 'memberId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const validRoles = ['viewer', 'marketing', 'member', 'admin']
  if (!body.role || !validRoles.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Invalid role. Allowed: viewer, marketing, member, admin' })
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

  const oldRole = target.role
  const newRole = body.role

  const { data: updated, error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error updating member role' })

  // If downgrading from admin→member/viewer: auto-assign ALL projects
  const adminRoles = ['admin', 'owner', 'superadmin']
  const wasAdmin = adminRoles.includes(oldRole)
  const isNowLower = !adminRoles.includes(newRole)

  if (wasAdmin && isNowLower) {
    // Get all workspace projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('archived', false)

    if (projects && projects.length > 0) {
      const rows = projects.map(p => ({
        project_id: p.id,
        user_id: target.user_id,
        workspace_id: workspaceId,
      }))
      await supabase.from('project_members').upsert(rows, { onConflict: 'project_id,user_id' })
    }
  }

  // If upgrading member/viewer→admin: clean up project_members (no longer needed)
  const wasLower = !adminRoles.includes(oldRole)
  const isNowAdmin = adminRoles.includes(newRole)

  if (wasLower && isNowAdmin) {
    await supabase
      .from('project_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', target.user_id)
  }

  return updated
})
