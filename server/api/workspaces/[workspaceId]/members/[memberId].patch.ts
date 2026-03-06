import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const memberId = getRouterParam(event, 'memberId')!

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const { user, membership } = await requireWorkspaceRole(event, workspaceId, 'admin')
  const isSuperadmin = membership.role === 'superadmin'

  const validRoles = isSuperadmin
    ? ['viewer', 'marketing', 'member', 'admin', 'owner']
    : ['viewer', 'marketing', 'member', 'admin']

  if (!body.role || !validRoles.includes(body.role)) {
    throw createError({ statusCode: 400, message: `Invalid role. Allowed: ${validRoles.join(', ')}` })
  }

  const { data: target } = await supabase
    .from('workspace_members')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!target) throw createError({ statusCode: 404, message: 'Member not found' })

  // Only superadmins can change an owner's role
  if (target.role === 'owner' && !isSuperadmin) {
    throw createError({ statusCode: 403, message: 'Cannot change workspace owner role' })
  }

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

  // If downgrading from admin→member/viewer: assign all projects so they don't lose access
  // (admin can then remove specific projects via the project assignment UI)
  const adminRoles = ['admin', 'owner', 'superadmin']
  const wasAdmin = adminRoles.includes(oldRole)
  const isNowLower = !adminRoles.includes(newRole)

  if (wasAdmin && isNowLower) {
    // Check if user already has project_members entries
    const { data: existingPm } = await supabase
      .from('project_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', target.user_id)
      .limit(1)

    // Only auto-assign if they have NO project_members yet (first downgrade)
    if (!existingPm || existingPm.length === 0) {
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
