import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  let user
  try {
    user = await requireUser(event)
  } catch (e) {
    console.error('[user/workspaces] Error getting user:', e)
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const isSuperadmin = isPlatformAdmin(user.email)

  // Superadmin sees ALL workspaces (read-only, no DB writes)
  if (isSuperadmin) {
    const { data: allWorkspaces, error } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .order('created_at', { ascending: false })

    if (error) throw createError({ statusCode: 500, message: 'Error loading workspaces' })

    return (allWorkspaces || []).map((ws: any) => ({
      workspace_id: ws.id,
      role: 'superadmin',
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
    }))
  }

  // Regular user: get workspaces via memberships
  const { data: memberships, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, slug)')
    .eq('user_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, message: 'Error loading workspace memberships' })
  }

  const results = (memberships || [])
    .filter((m: any) => m.workspaces)
    .map((m: any) => ({
      workspace_id: m.workspace_id,
      role: m.role,
      ...m.workspaces,
    }))

  // Auto-fix: Check if user owns workspaces without membership rows
  if (results.length === 0) {
    const { data: ownedWorkspaces } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .eq('owner_id', user.id)

    if (ownedWorkspaces && ownedWorkspaces.length > 0) {

      for (const ws of ownedWorkspaces) {
        await supabase
          .from('workspace_members')
          .upsert({ workspace_id: ws.id, user_id: user.id, role: 'owner' }, { onConflict: 'workspace_id,user_id' })
      }

      return ownedWorkspaces.map((ws: any) => ({
        workspace_id: ws.id,
        role: 'owner',
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
      }))
    }
  }

  return results
})
