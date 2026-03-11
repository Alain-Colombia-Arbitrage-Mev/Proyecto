import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!

  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Fetch all projects in the workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('id, status')
    .eq('workspace_id', workspaceId)

  const projectIds = (projects || []).map(p => p.id)
  const projectsCount = projectIds.length

  // Count projects with active status (not archived/completed)
  const activeProjects = (projects || []).filter(
    p => p.status && !['archived', 'completed', 'cancelled'].includes(p.status)
  ).length

  if (projectIds.length === 0) {
    return {
      total_tasks: 0,
      completed_tasks: 0,
      open_tasks: 0,
      completion_rate: 0,
      projects_count: 0,
      active_projects: 0,
      total_time_minutes: 0,
    }
  }

  // Determine "done" columns: the last column by position in each project
  const { data: allColumns } = await supabase
    .from('kanban_columns')
    .select('id, project_id, position')
    .in('project_id', projectIds)
    .order('position', { ascending: false })

  const doneColumnIds: string[] = []
  if (allColumns && allColumns.length > 0) {
    const lastColPerProject = new Map<string, string>()
    for (const col of allColumns) {
      if (!lastColPerProject.has(col.project_id)) {
        lastColPerProject.set(col.project_id, col.id)
      }
    }
    doneColumnIds.push(...lastColPerProject.values())
  }

  const allColumnIds = (allColumns || []).map(c => c.id)
  const safeColumnIds = allColumnIds.length > 0 ? allColumnIds : ['00000000-0000-0000-0000-000000000000']

  // Total tasks across all projects (only in valid columns, root-level only)
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .in('column_id', safeColumnIds)
    .is('parent_task_id', null) // root-level tasks only to avoid double-counting subtasks

  // Completed tasks (in done columns)
  let completedTasks = 0
  if (doneColumnIds.length > 0) {
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .in('column_id', doneColumnIds)
      .is('parent_task_id', null)

    completedTasks = count || 0
  }

  const total = totalTasks || 0
  const openTasks = total - completedTasks
  const completionRate = total > 0 ? Math.round((completedTasks / total) * 100) : 0

  // Total tracked time across all tasks in workspace
  const { data: timeData } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .in('project_id', projectIds)

  const totalTimeMinutes = (timeData || []).reduce(
    (sum, row) => sum + (row.duration_minutes || 0),
    0
  )

  return {
    total_tasks: total,
    completed_tasks: completedTasks,
    open_tasks: openTasks,
    completion_rate: completionRate,
    projects_count: projectsCount,
    active_projects: activeProjects,
    total_time_minutes: totalTimeMinutes,
  }
})
