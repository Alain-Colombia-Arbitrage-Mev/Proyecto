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

  // Build a map of project_id -> set of its column IDs
  const columnsByProject = new Map<string, Set<string>>()
  const lastColByProject = new Map<string, string>()
  for (const col of (cols || [])) {
    if (!columnsByProject.has(col.project_id)) columnsByProject.set(col.project_id, new Set())
    columnsByProject.get(col.project_id)!.add(col.id)
    // cols are ordered by position DESC, so first seen per project is the last column
    if (!lastColByProject.has(col.project_id)) lastColByProject.set(col.project_id, col.id)
  }

  // Fetch all tasks with their project_id and column_id
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('project_id, column_id, due_date')
    .in('project_id', projectIds)

  // Count only tasks whose column_id belongs to their own project's columns
  const today = new Date().toISOString().slice(0, 10)
  let totalTasks = 0
  let completedTasks = 0
  let dueTodayTasks = 0
  const projectTaskCounts: Record<string, { total: number; completed: number }> = {}
  for (const pid of projectIds) {
    projectTaskCounts[pid] = { total: 0, completed: 0 }
  }

  for (const t of (allTasks || [])) {
    const projectCols = columnsByProject.get(t.project_id)
    // Skip orphaned tasks: column_id doesn't belong to this task's project
    if (!projectCols || !projectCols.has(t.column_id)) continue

    totalTasks++
    projectTaskCounts[t.project_id].total++

    if (t.column_id === lastColByProject.get(t.project_id)) {
      completedTasks++
      projectTaskCounts[t.project_id].completed++
    }

    if (t.due_date === today) {
      dueTodayTasks++
    }
  }

  return {
    totalTasks: totalTasks || 0,
    completedTasks,
    dueTodayTasks: dueTodayTasks || 0,
    projectTaskCounts,
  }
})
