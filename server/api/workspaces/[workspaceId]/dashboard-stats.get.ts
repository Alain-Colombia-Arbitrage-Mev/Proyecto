import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Get project IDs this user can access
  const projectIds = await getUserProjectIds(event, workspaceId, user.id, membership.role)

  // If member/viewer with no project access, return empty
  if (projectIds !== null && projectIds.length === 0) {
    return { taskCount: 0, completedTasks: 0, recentTasks: [], lastColumnIds: [] }
  }

  // Build project filter
  let projectFilter: string[] | null = null
  if (projectIds !== null) {
    projectFilter = projectIds
  } else {
    // admin+ sees all workspace projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('workspace_id', workspaceId)
    projectFilter = (projects || []).map(p => p.id)
  }

  if (projectFilter.length === 0) {
    return { taskCount: 0, completedTasks: 0, recentTasks: [], lastColumnIds: [] }
  }

  // Run all queries in parallel
  const [totalResult, colsResult, recentResult] = await Promise.all([
    // Total task count
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectFilter),

    // Get kanban columns to find last column per project
    supabase
      .from('kanban_columns')
      .select('id, project_id, position')
      .in('project_id', projectFilter)
      .order('position', { ascending: false }),

    // Recent 20 tasks with project name
    supabase
      .from('tasks')
      .select('id, title, priority, created_at, column_id, project_id, due_date')
      .in('project_id', projectFilter)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const taskCount = totalResult.count || 0

  // Calculate completed tasks (tasks in last column per project)
  let completedTasks = 0
  const lastColumnIds: string[] = []
  if (colsResult.data && colsResult.data.length > 0) {
    const lastCols = new Map<string, string>()
    for (const col of colsResult.data) {
      if (!lastCols.has(col.project_id)) lastCols.set(col.project_id, col.id)
    }
    const colIds = Array.from(lastCols.values())
    lastColumnIds.push(...colIds)

    if (colIds.length > 0) {
      const { count: done } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('column_id', colIds)
      completedTasks = done || 0
    }
  }

  // Get project names for recent tasks
  const { data: projectNames } = await supabase
    .from('projects')
    .select('id, name')
    .in('id', projectFilter)

  const projectMap = new Map((projectNames || []).map(p => [p.id, p.name]))

  const recentTasks = (recentResult.data || []).map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority || 'medium',
    created_at: t.created_at,
    column_id: t.column_id,
    project_id: t.project_id,
    due_date: t.due_date,
    projectName: projectMap.get(t.project_id) || '—',
    isCompleted: lastColumnIds.includes(t.column_id),
  }))

  return { taskCount, completedTasks, recentTasks, lastColumnIds }
})
