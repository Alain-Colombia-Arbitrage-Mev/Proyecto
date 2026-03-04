import { serverSupabaseServiceRole } from '#supabase/server'

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

  // Get all columns for this project, ordered by position
  const { data: columns, error: colErr } = await supabase
    .from('kanban_columns')
    .select('id, title')
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (colErr) {
    console.error('[cumulative-flow.get] columns error:', colErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching columns' })
  }

  if (!columns || columns.length === 0) {
    return { dates: [], columns: [] }
  }

  // Build 30-day date range (last 30 days including today)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const dates: string[] = []
  for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10))
  }

  // Fetch task_column_history for this project's tasks in the window
  // We need to know for each task, which column it was in on each date.
  // Strategy: for each (task, date), find the most recent column entry at or before that date.
  const { data: historyRows, error: histErr } = await supabase
    .from('task_column_history')
    .select('task_id, column_id, entered_at, exited_at')
    .in('column_id', columns.map(c => c.id))
    .gte('entered_at', thirtyDaysAgo.toISOString())
    .order('entered_at', { ascending: true })

  if (histErr) {
    console.error('[cumulative-flow.get] history error:', histErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching column history' })
  }

  // Also fetch current column for all tasks (tasks with no recent history but exist)
  const { data: currentTasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, column_id, created_at')
    .eq('project_id', projectId)
    .not('column_id', 'is', null)

  if (tasksErr) {
    console.error('[cumulative-flow.get] current tasks error:', tasksErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching tasks' })
  }

  // For each date, count how many tasks were in each column
  // We use a snapshot approach: for each task, determine which column it was in on each date
  const columnSet = new Set(columns.map(c => c.id))
  const colCountsByDate: Record<string, Record<string, number>> = {}

  for (const dateStr of dates) {
    colCountsByDate[dateStr] = {}
    for (const col of columns) {
      colCountsByDate[dateStr][col.id] = 0
    }
  }

  // Build a per-task history of (column_id, entered_at, exited_at) intervals
  const taskIntervals: Record<string, Array<{ column_id: string; entered_at: Date; exited_at: Date | null }>> = {}

  for (const row of (historyRows || [])) {
    if (!columnSet.has(row.column_id)) continue
    if (!taskIntervals[row.task_id]) taskIntervals[row.task_id] = []
    taskIntervals[row.task_id]!.push({
      column_id: row.column_id,
      entered_at: new Date(row.entered_at),
      exited_at: row.exited_at ? new Date(row.exited_at) : null,
    })
  }

  // For tasks with no history in window, use their current column from creation
  for (const task of (currentTasks || [])) {
    if (!task.column_id || !columnSet.has(task.column_id)) continue
    if (!taskIntervals[task.id]) {
      // No history in window — assume they've been in their current column since creation
      taskIntervals[task.id] = [{
        column_id: task.column_id,
        entered_at: new Date(task.created_at),
        exited_at: null,
      }]
    }
  }

  // For each date, find each task's column
  for (const [, intervals] of Object.entries(taskIntervals)) {
    for (const dateStr of dates) {
      const dayEnd = new Date(dateStr)
      dayEnd.setHours(23, 59, 59, 999)

      // Find the interval active at end of day
      let activeColumnId: string | null = null
      for (const interval of intervals) {
        if (interval.entered_at > dayEnd) continue
        if (interval.exited_at && interval.exited_at <= dayEnd) continue
        // This interval was active at end of this day
        activeColumnId = interval.column_id
        break
      }

      if (activeColumnId && colCountsByDate[dateStr]?.[activeColumnId] !== undefined) {
        colCountsByDate[dateStr]![activeColumnId]++
      }
    }
  }

  // Shape the response: array of column objects with counts per date
  const columnSeries = columns.map(col => ({
    name: (col as any).title,
    counts: dates.map(d => colCountsByDate[d]?.[col.id] ?? 0),
  }))

  return { dates, columns: columnSeries }
})
