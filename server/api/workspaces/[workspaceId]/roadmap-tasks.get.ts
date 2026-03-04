import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'view_roadmap')

  const supabase = serverSupabaseServiceRole(event)

  // Fetch projects
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, name, description, status, start_date, end_date, color, created_at')
    .eq('workspace_id', workspaceId)
    .order('start_date', { ascending: true, nullsFirst: false })

  if (projErr) {
    throw createError({ statusCode: 500, message: 'Error fetching projects' })
  }

  const projectList = projects || []
  if (projectList.length === 0) {
    return { projects: [], tasks: [], relationships: [], milestones: [], members: [] }
  }

  const projectIds = projectList.map(p => p.id)

  // Run all queries in parallel
  const [tasksResult, relationshipsResult, milestonesResult, membersResult] = await Promise.all([
    // Tasks with assignees
    supabase
      .from('tasks')
      .select('id, title, project_id, priority, due_date, created_at, assignees, position, column_id')
      .in('project_id', projectIds)
      .order('position', { ascending: true }),

    // Blocking relationships only
    supabase
      .from('task_relationships')
      .select('id, source_task_id, target_task_id, relationship_type')
      .eq('relationship_type', 'blocks'),

    // Milestones
    supabase
      .from('project_milestones')
      .select('id, project_id, title, target_date, completed')
      .in('project_id', projectIds)
      .order('target_date', { ascending: true }),

    // Workspace members for assignee display
    supabase
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', workspaceId),
  ])

  // Filter relationships to only include tasks in these projects
  const taskIds = new Set((tasksResult.data || []).map(t => t.id))
  const relationships = (relationshipsResult.data || []).filter(
    r => taskIds.has(r.source_task_id) && taskIds.has(r.target_task_id),
  )

  // Map milestones
  const milestones = (milestonesResult.data || []).map(m => ({
    id: m.id,
    project_id: m.project_id,
    title: m.title,
    target_date: m.target_date,
    completed: !!m.completed,
  }))

  return {
    projects: projectList,
    tasks: tasksResult.data || [],
    relationships,
    milestones,
    members: membersResult.data || [],
  }
})
