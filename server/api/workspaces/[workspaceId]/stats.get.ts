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

  // Total tasks
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)

  // Completed tasks (tasks in the last column of each project)
  const { data: cols } = await supabase
    .from('kanban_columns')
    .select('id, project_id, position')
    .in('project_id', projectIds)
    .order('position', { ascending: false })

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

  // Due today
  const today = new Date().toISOString().slice(0, 10)
  const { count: dueTodayTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('due_date', today)

  return {
    totalTasks: totalTasks || 0,
    completedTasks,
    dueTodayTasks: dueTodayTasks || 0,
  }
})
