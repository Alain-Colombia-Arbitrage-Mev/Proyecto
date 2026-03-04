import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'view_roadmap')

  const supabase = serverSupabaseServiceRole(event)

  // Fetch all projects in workspace with timeline fields
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, name, description, status, start_date, end_date, color, created_at')
    .eq('workspace_id', workspaceId)
    .order('start_date', { ascending: true, nullsFirst: false })

  if (projErr) {
    console.error('[roadmap.get] projects fetch error:', projErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching projects' })
  }

  const projectList = projects || []

  if (projectList.length === 0) {
    return { projects: [] }
  }

  const projectIds = projectList.map(p => p.id)

  // Fetch dependencies and milestones in parallel
  const [{ data: dependencies, error: depErr }, { data: milestones, error: milErr }] = await Promise.all([
    supabase
      .from('project_dependencies')
      .select('id, source_project_id, target_project_id, dependency_type')
      .or(`source_project_id.in.(${projectIds.join(',')}),target_project_id.in.(${projectIds.join(',')})`)
      .in('source_project_id', projectIds),
    supabase
      .from('project_milestones')
      .select('id, project_id, title, target_date, completed')
      .in('project_id', projectIds)
      .order('target_date', { ascending: true }),
  ])

  if (depErr) {
    console.error('[roadmap.get] dependencies fetch error:', depErr.message)
    // Non-fatal: return projects without dependencies
  }
  if (milErr) {
    console.error('[roadmap.get] milestones fetch error:', milErr.message)
    // Non-fatal: return projects without milestones
  }

  // Index milestones by project_id
  const milestonesByProject: Record<string, typeof milestones> = {}
  for (const milestone of (milestones || [])) {
    if (!milestonesByProject[milestone.project_id]) {
      milestonesByProject[milestone.project_id] = []
    }
    milestonesByProject[milestone.project_id]!.push(milestone)
  }

  // Attach dependencies and milestones to each project
  const enrichedProjects = projectList.map(p => ({
    ...p,
    milestones: milestonesByProject[p.id] || [],
    dependencies: (dependencies || []).filter(
      d => d.source_project_id === p.id || d.target_project_id === p.id,
    ),
  }))

  return {
    projects: enrichedProjects,
    all_dependencies: dependencies || [],
  }
})
