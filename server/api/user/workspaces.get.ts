import { serverSupabaseServiceRole } from '#supabase/server'

async function getWorkspaceCounts(supabase: any, wsIds: string[]) {
  if (wsIds.length === 0) return {}

  const [projectsRes, membersRes] = await Promise.all([
    supabase
      .from('projects')
      .select('workspace_id')
      .in('workspace_id', wsIds)
      .eq('archived', false),
    supabase
      .from('workspace_members')
      .select('workspace_id')
      .in('workspace_id', wsIds),
  ])

  // Count projects per workspace
  const counts: Record<string, { projects: number; tasks: number; members: number }> = {}
  for (const id of wsIds) counts[id] = { projects: 0, tasks: 0, members: 0 }

  for (const p of (projectsRes.data || [])) {
    if (counts[p.workspace_id]) counts[p.workspace_id].projects++
  }
  for (const m of (membersRes.data || [])) {
    if (counts[m.workspace_id]) counts[m.workspace_id].members++
  }

  // Get task counts via projects
  const projectIds = (projectsRes.data || []).map((p: any) => p.workspace_id)
  if (projectIds.length > 0) {
    // Get all project ids grouped by workspace
    const { data: projects } = await supabase
      .from('projects')
      .select('id, workspace_id')
      .in('workspace_id', wsIds)
      .eq('archived', false)

    if (projects && projects.length > 0) {
      const pIds = projects.map((p: any) => p.id)
      const projectWsMap: Record<string, string> = {}
      for (const p of projects) projectWsMap[p.id] = p.workspace_id

      const { data: tasks } = await supabase
        .from('tasks')
        .select('project_id')
        .in('project_id', pIds)

      for (const t of (tasks || [])) {
        const wsId = projectWsMap[t.project_id]
        if (wsId && counts[wsId]) counts[wsId].tasks++
      }
    }
  }

  return counts
}

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

      const wsIds = (allWorkspaces || []).map((ws: any) => ws.id)
      const counts = await getWorkspaceCounts(supabase, wsIds)

      return (allWorkspaces || []).map((ws: any) => ({
        workspace_id: ws.id,
        role: 'superadmin',
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        projectCount: counts[ws.id]?.projects ?? 0,
        taskCount: counts[ws.id]?.tasks ?? 0,
        memberCount: counts[ws.id]?.members ?? 0,
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

    let results = (memberships || [])
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

        results = ownedWorkspaces.map((ws: any) => ({
          workspace_id: ws.id,
          role: 'owner',
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
        }))
      }
    }

    // Enrich with counts
    const wsIds = results.map((r: any) => r.id || r.workspace_id)
    const counts = await getWorkspaceCounts(supabase, wsIds)

    return results.map((r: any) => ({
      ...r,
      projectCount: counts[r.id || r.workspace_id]?.projects ?? 0,
      taskCount: counts[r.id || r.workspace_id]?.tasks ?? 0,
      memberCount: counts[r.id || r.workspace_id]?.members ?? 0,
    }))
  } catch (e: any) {
    // If it's already a createError, re-throw with visible message
    if (e?.statusCode) throw e
    // Unexpected error — surface it
    console.error('[user/workspaces] Unexpected:', e)
    throw createError({ statusCode: 500, message: `Unexpected: ${e?.message || String(e)}` })
  }
})
