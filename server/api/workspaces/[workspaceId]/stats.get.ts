import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Get all project IDs in this workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)

  const projectIds = (projects || []).map(p => p.id)
  if (projectIds.length === 0) {
    return { totalTasks: 0, completedTasks: 0, dueTodayTasks: 0 }
  }

  // Get all valid columns first — we only count tasks assigned to existing columns
  const { data: cols } = await supabase
    .from('kanban_columns')
    .select('id, project_id, position')
    .in('project_id', projectIds)
    .order('position', { ascending: false })

  const validColumnIds = (cols || []).map(c => c.id)

  // Total tasks (only those in valid columns — excludes orphaned tasks)
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .in('column_id', validColumnIds.length > 0 ? validColumnIds : ['00000000-0000-0000-0000-000000000000'])

  let completedTasks = 0
  if (cols && cols.length > 0) {
    const lastCols = new Map<string, string>()
    for (const col of cols) {
      if (!lastCols.has(col.project_id)) lastCols.set(col.project_id, col.id)
    }
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('column_id', Array.from(lastCols.values()))
    completedTasks = count || 0
  }

  // Due today (only tasks in valid columns)
  const today = new Date().toISOString().slice(0, 10)
  const { count: dueTodayTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .in('column_id', validColumnIds.length > 0 ? validColumnIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('due_date', today)

  // Per-project task counts (only tasks in valid columns)
  const { data: perProjectTasks } = await supabase
    .from('tasks')
    .select('project_id')
    .in('project_id', projectIds)
    .in('column_id', validColumnIds.length > 0 ? validColumnIds : ['00000000-0000-0000-0000-000000000000'])

  const projectTaskCounts: Record<string, { total: number; completed: number }> = {}
  for (const pid of projectIds) {
    projectTaskCounts[pid] = { total: 0, completed: 0 }
  }
  if (perProjectTasks) {
    for (const t of perProjectTasks) {
      if (projectTaskCounts[t.project_id]) {
        projectTaskCounts[t.project_id].total++
      }
    }
  }

  // Count completed per project using lastCols map
  if (cols && cols.length > 0) {
    const lastCols2 = new Map<string, string>()
    for (const col of cols) {
      if (!lastCols2.has(col.project_id)) lastCols2.set(col.project_id, col.id)
    }
    const colToProject = new Map<string, string>()
    for (const [pid, cid] of lastCols2) colToProject.set(cid, pid)

    const { data: completedPerProject } = await supabase
      .from('tasks')
      .select('column_id')
      .in('column_id', Array.from(lastCols2.values()))

    if (completedPerProject) {
      for (const t of completedPerProject) {
        const pid = colToProject.get(t.column_id)
        if (pid && projectTaskCounts[pid]) {
          projectTaskCounts[pid].completed++
        }
      }
    }
  }

  return {
    totalTasks: totalTasks || 0,
    completedTasks,
    dueTodayTasks: dueTodayTasks || 0,
    projectTaskCounts,
  }
})
