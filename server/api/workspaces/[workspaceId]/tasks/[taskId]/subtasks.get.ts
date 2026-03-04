import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!

  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Verify the parent task exists and belongs to this workspace via the project join.
  // We do this before fetching children so we return 404 on a bad taskId rather than
  // an empty array that silently masks the error.
  const { data: parentTask, error: parentErr } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (parentErr) {
    console.error('[subtasks.get] parent task lookup error:', parentErr.message, parentErr.details)
    throw createError({ statusCode: 500, message: 'Error fetching parent task' })
  }
  if (!parentTask) throw createError({ statusCode: 404, message: 'Task not found' })

  // Fetch direct children ordered by their board position.
  // The subtask_counts fields give callers a cheap summary without a second round-trip.
  // Supabase does not support correlated subqueries in .select(), so we fetch the raw
  // subtasks first and then run a single aggregation query for the counts.
  const { data: subtasks, error: subtasksErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_task_id', taskId)
    .order('position', { ascending: true })

  if (subtasksErr) {
    console.error('[subtasks.get] subtasks fetch error:', subtasksErr.message, subtasksErr.details)
    throw createError({ statusCode: 500, message: 'Error fetching subtasks' })
  }

  const rows = subtasks || []

  if (rows.length === 0) {
    return []
  }

  // Aggregate child counts for every subtask in a single query.
  // Each subtask may itself have children (up to max depth 3), and the frontend
  // often renders a progress indicator based on completed vs. total children.
  const subtaskIds = rows.map(t => t.id)

  const { data: grandchildren } = await supabase
    .from('tasks')
    .select('parent_task_id, status')
    .in('parent_task_id', subtaskIds)

  // Build O(1) lookup maps for counts
  const totalMap: Record<string, number> = {}
  const completedMap: Record<string, number> = {}
  for (const gc of grandchildren || []) {
    const pid = gc.parent_task_id
    totalMap[pid] = (totalMap[pid] || 0) + 1
    if (gc.status === 'done') {
      completedMap[pid] = (completedMap[pid] || 0) + 1
    }
  }

  // Attach counts to each subtask
  const result = rows.map(task => ({
    ...task,
    subtask_count: totalMap[task.id] || 0,
    subtask_completed_count: completedMap[task.id] || 0,
  }))

  return result
})
