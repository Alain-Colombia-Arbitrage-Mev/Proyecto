import { serverSupabaseServiceRole } from '#supabase/server'

interface ColumnCycleTime {
  column_name: string
  avg_hours: number
  sample_count: number
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

  // Get all columns for this project
  const { data: columns, error: colErr } = await supabase
    .from('kanban_columns')
    .select('id, title')
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (colErr) {
    console.error('[cycle-time.get] columns error:', colErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching columns' })
  }

  if (!columns || columns.length === 0) {
    return { avg_hours: 0, by_column: [] as ColumnCycleTime[] }
  }

  const columnIds = columns.map(c => c.id)

  // Fetch all history entries with both entered_at and exited_at (completed intervals only)
  const { data: history, error: histErr } = await supabase
    .from('task_column_history')
    .select('task_id, column_id, entered_at, exited_at')
    .in('column_id', columnIds)
    .not('exited_at', 'is', null)

  if (histErr) {
    console.error('[cycle-time.get] history error:', histErr.message)
    throw createError({ statusCode: 500, message: 'Error fetching column history' })
  }

  const rows = history || []

  if (rows.length === 0) {
    return {
      avg_hours: 0,
      by_column: columns.map(c => ({ column_name: c.name, avg_hours: 0, sample_count: 0 })),
    }
  }

  // Build column name lookup
  const columnNameById: Record<string, string> = {}
  for (const col of columns) {
    columnNameById[col.id] = (col as any).title
  }

  // Calculate time spent per interval, grouped by column
  const hoursByColumn: Record<string, number[]> = {}
  let totalHoursAll = 0
  let totalCountAll = 0

  for (const row of rows) {
    if (!row.entered_at || !row.exited_at) continue

    const enteredMs = new Date(row.entered_at).getTime()
    const exitedMs = new Date(row.exited_at).getTime()
    if (exitedMs <= enteredMs) continue

    const hours = (exitedMs - enteredMs) / 3_600_000

    if (!hoursByColumn[row.column_id]) hoursByColumn[row.column_id] = []
    hoursByColumn[row.column_id]!.push(hours)

    totalHoursAll += hours
    totalCountAll++
  }

  const avg_hours = totalCountAll > 0
    ? Math.round((totalHoursAll / totalCountAll) * 100) / 100
    : 0

  const by_column: ColumnCycleTime[] = columns.map(col => {
    const colHours = hoursByColumn[col.id] || []
    const colAvg = colHours.length > 0
      ? Math.round((colHours.reduce((sum, h) => sum + h, 0) / colHours.length) * 100) / 100
      : 0
    return {
      column_name: (col as any).title,
      avg_hours: colAvg,
      sample_count: colHours.length,
    }
  })

  return { avg_hours, by_column }
})
