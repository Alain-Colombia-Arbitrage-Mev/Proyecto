import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * GET /api/admin/workspaces
 * Superadmin-only: returns all workspaces with member counts and project lists.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  if (!isPlatformAdmin(user.email)) {
    throw createError({ statusCode: 403, message: 'Superadmin access required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .order('name')

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Get projects per workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color, workspace_id')
    .eq('archived', false)
    .order('name')

  const projectsByWorkspace: Record<string, Array<{ id: string; name: string; color: string }>> = {}
  if (projects) {
    for (const p of projects) {
      if (!projectsByWorkspace[p.workspace_id]) projectsByWorkspace[p.workspace_id] = []
      projectsByWorkspace[p.workspace_id].push({ id: p.id, name: p.name, color: p.color })
    }
  }

  return (workspaces || []).map(ws => ({
    ...ws,
    projects: projectsByWorkspace[ws.id] || [],
  }))
})
