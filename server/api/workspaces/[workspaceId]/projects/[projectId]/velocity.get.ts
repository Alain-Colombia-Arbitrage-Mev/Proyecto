import { serverSupabaseServiceRole } from '#supabase/server'

interface VelocityPoint {
  sprint_id: string
  sprint_name: string
  start_date: string
  end_date: string
  completed: number
  total: number
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  await requirePermission(event, workspaceId, 'view_reports')

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  // Fetch all completed sprints, ordered chronologically
  const { data: sprints, error: sprintsErr } = await supabase
    .from('sprints')
    .select('id, name, start_date, end_date')
    .eq('project_id', projectId)
    .eq('status', 'completed')
    .order('end_date', { ascending: true })

  if (sprintsErr) {
    console.error('[velocity.get] sprints fetch error:', sprintsErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching sprints' })
  }

  if (!sprints || sprints.length === 0) {
    return { points: [] as VelocityPoint[] }
  }

  const sprintIds = sprints.map(s => s.id)

  // Fetch all tasks in these sprints
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, sprint_id')
    .in('sprint_id', sprintIds)
    .eq('project_id', projectId)

  if (tasksErr) {
    console.error('[velocity.get] tasks fetch error:', tasksErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching tasks' })
  }

  // Find tasks that completed within each sprint by checking task_column_history
  // A task is "completed" if it entered a done column during the sprint's date range
  const taskIds = (tasks || []).map(t => t.id)
  const completedTasksBySprint: Record<string, Set<string>> = {}

  if (taskIds.length > 0) {
    const { data: doneHistory, error: histErr } = await supabase
      .from('task_column_history')
      .select('task_id, entered_at, kanban_columns!inner(is_done)')
      .in('task_id', taskIds)
      .eq('kanban_columns.is_done', true)

    if (histErr) {
      console.error('[velocity.get] history fetch error:', histErr.message)
      throw createError({ statusCode: 500, message: 'Error fetching column history' })
    }

    // Map task_id -> sprint_id for quick lookup
    const taskSprintMap: Record<string, string> = {}
    for (const t of (tasks || [])) {
      if (t.sprint_id) taskSprintMap[t.id] = t.sprint_id
    }

    // Map sprint_id -> sprint dates
    const sprintDateMap: Record<string, { start: Date; end: Date }> = {}
    for (const s of sprints) {
      sprintDateMap[s.id] = { start: new Date(s.start_date), end: new Date(s.end_date) }
    }

    for (const row of (doneHistory || [])) {
      const sprintId = taskSprintMap[row.task_id]
      if (!sprintId) continue

      const dates = sprintDateMap[sprintId]
      if (!dates) continue

      const enteredAt = new Date(row.entered_at)
      if (enteredAt >= dates.start && enteredAt <= dates.end) {
        if (!completedTasksBySprint[sprintId]) {
          completedTasksBySprint[sprintId] = new Set()
        }
        completedTasksBySprint[sprintId].add(row.task_id)
      }
    }
  }

  // Build velocity data per sprint
  const totalTasksBySprint: Record<string, number> = {}
  for (const t of (tasks || [])) {
    if (!t.sprint_id) continue
    totalTasksBySprint[t.sprint_id] = (totalTasksBySprint[t.sprint_id] || 0) + 1
  }

  const points: VelocityPoint[] = sprints.map(s => ({
    sprint_id: s.id,
    sprint_name: s.name,
    start_date: s.start_date,
    end_date: s.end_date,
    completed: completedTasksBySprint[s.id]?.size ?? 0,
    total: totalTasksBySprint[s.id] ?? 0,
  }))

  return { points }
})
