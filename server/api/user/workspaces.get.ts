import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Wrap entire handler to surface errors in response
  try {
    let user
    try {
      user = await requireUser(event)
    } catch (e: any) {
      const msg = e?.statusMessage || e?.message || 'unknown'
      throw createError({ statusCode: 401, message: `Auth failed: ${msg}` })
    }

    const supabase = serverSupabaseServiceRole(event)
    const isSuperadmin = isPlatformAdmin(user.email)

    // Superadmin sees ALL workspaces
    if (isSuperadmin) {
      const { data: allWorkspaces, error } = await supabase
        .from('workspaces')
        .select('id, name, slug')
        .order('created_at', { ascending: false })

      if (error) throw createError({ statusCode: 500, message: `DB error: ${error.message}` })

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
      throw createError({ statusCode: 500, message: `Memberships error: ${error.message}` })
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
  } catch (e: any) {
    // If it's already a createError, re-throw with visible message
    if (e?.statusCode) throw e
    // Unexpected error — surface it
    console.error('[user/workspaces] Unexpected:', e)
    throw createError({ statusCode: 500, message: `Unexpected: ${e?.message || String(e)}` })
  }
})
