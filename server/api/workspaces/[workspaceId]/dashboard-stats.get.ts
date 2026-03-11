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

  // Get kanban columns and project names in parallel
  const [colsResult, projectNamesResult, allTasksResult] = await Promise.all([
    supabase
      .from('kanban_columns')
      .select('id, project_id, position')
      .in('project_id', projectFilter)
      .order('position', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .in('id', projectFilter),
    supabase
      .from('tasks')
      .select('id, title, priority, created_at, column_id, project_id, due_date')
      .in('project_id', projectFilter)
      .order('created_at', { ascending: false }),
  ])

  // Build map of project_id -> set of its column IDs
  const columnsByProject = new Map<string, Set<string>>()
  const lastColByProject = new Map<string, string>()
  for (const col of (colsResult.data || [])) {
    if (!columnsByProject.has(col.project_id)) columnsByProject.set(col.project_id, new Set())
    columnsByProject.get(col.project_id)!.add(col.id)
    if (!lastColByProject.has(col.project_id)) lastColByProject.set(col.project_id, col.id)
  }

  const lastColumnIds = Array.from(lastColByProject.values())
  const projectMap = new Map((projectNamesResult.data || []).map(p => [p.id, p.name]))

  // Filter: only tasks whose column_id belongs to their own project's columns
  let taskCount = 0
  let completedTasks = 0
  const recentTasks: any[] = []

  for (const t of (allTasksResult.data || [])) {
    const projectCols = columnsByProject.get(t.project_id)
    if (!projectCols || !projectCols.has(t.column_id)) continue

    taskCount++
    const isCompleted = t.column_id === lastColByProject.get(t.project_id)
    if (isCompleted) completedTasks++

    if (recentTasks.length < 20) {
      recentTasks.push({
        id: t.id,
        title: t.title,
        priority: t.priority || 'medium',
        created_at: t.created_at,
        column_id: t.column_id,
        project_id: t.project_id,
        due_date: t.due_date,
        projectName: projectMap.get(t.project_id) || '—',
        isCompleted,
      })
    }
  }

  return { taskCount, completedTasks, recentTasks, lastColumnIds }
})
