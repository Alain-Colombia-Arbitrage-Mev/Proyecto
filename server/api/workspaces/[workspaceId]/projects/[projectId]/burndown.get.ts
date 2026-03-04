import { serverSupabaseServiceRole } from '#supabase/server'

interface BurndownPoint {
  date: string
  remaining: number
  ideal: number
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  await requirePermission(event, workspaceId, 'view_reports')

  const query = getQuery(event)
  const sprintId = query.sprint_id as string | undefined

  if (!sprintId) throw createError({ statusCode: 400, message: 'sprint_id query parameter is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  // Fetch the sprint
  const { data: sprint, error: sprintErr } = await supabase
    .from('sprints')
    .select('id, name, start_date, end_date, status')
    .eq('id', sprintId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (sprintErr || !sprint) throw createError({ statusCode: 404, message: 'Sprint not found in this project' })

  // Fetch all tasks in the sprint
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, created_at')
    .eq('sprint_id', sprintId)
    .eq('project_id', projectId)

  if (tasksErr) {
    console.error('[burndown.get] tasks fetch error:', tasksErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching sprint tasks' })
  }

  const sprintTasks = tasks || []
  const totalTasks = sprintTasks.length

  // Fetch completion history: when tasks moved to a 'done'-type column
  // We identify done columns by looking for task_column_history entries where
  // the task is in a column with is_done=true or by checking column name heuristics.
  // We join task_column_history with kanban_columns to find terminal columns.
  const taskIds = sprintTasks.map(t => t.id)
  let completionsByDate: Record<string, number> = {}

  if (taskIds.length > 0) {
    const { data: doneHistory, error: histErr } = await supabase
      .from('task_column_history')
      .select('task_id, entered_at, kanban_columns!inner(is_done)')
      .in('task_id', taskIds)
      .eq('kanban_columns.is_done', true)
      .order('entered_at', { ascending: true })

    if (histErr) {
      console.error('[burndown.get] history fetch error:', histErr.message)
      throw createError({ statusCode: 500, message: 'Error fetching column history' })
    }

    // For each task, take the earliest time it entered a done column
    const firstDoneByTask: Record<string, string> = {}
    for (const row of (doneHistory || [])) {
      const taskId: string = row.task_id
      if (!firstDoneByTask[taskId]) {
        firstDoneByTask[taskId] = row.entered_at
      }
    }

    // Count completions per calendar date
    for (const [, enteredAt] of Object.entries(firstDoneByTask)) {
      const date = enteredAt.slice(0, 10)
      completionsByDate[date] = (completionsByDate[date] || 0) + 1
    }
  }

  // Build the burndown series over the sprint's date range
  const startDate = new Date(sprint.start_date)
  const endDate = new Date(sprint.end_date)
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000),
  )

  const points: BurndownPoint[] = []
  let remaining = totalTasks

  for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + dayOffset)
    const dateStr = date.toISOString().slice(0, 10)

    // Subtract tasks completed on this day
    remaining -= completionsByDate[dateStr] || 0

    // Ideal burndown: linear from totalTasks to 0
    const ideal = Math.round(totalTasks - (totalTasks * dayOffset) / totalDays)

    points.push({ date: dateStr, remaining: Math.max(0, remaining), ideal })
  }

  return { points, sprint }
})
