import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const goalId = getRouterParam(event, 'goalId')!
  await requirePermission(event, workspaceId, 'view_goals')

  const supabase = serverSupabaseServiceRole(event)

  // Fetch goal with its links
  const { data: goal, error: goalErr } = await supabase
    .from('goals')
    .select('id, current_value, target_value, status, goal_links(id, entity_type, entity_id)')
    .eq('id', goalId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (goalErr || !goal) throw createError({ statusCode: 404, message: 'Goal not found in this workspace' })

  const links = (goal.goal_links as Array<{ id: string; entity_type: string; entity_id: string }>) || []
  const taskLinks = links.filter(l => l.entity_type === 'task')

  let current_value = Number(goal.current_value ?? 0)
  let target_value = Number(goal.target_value ?? 0)
  let linked_entities = links.length

  // If task links exist, compute progress from task completion rate
  if (taskLinks.length > 0) {
    const taskIds = taskLinks.map(l => l.entity_id)

    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('id, column_id, kanban_columns!left(is_done)')
      .in('id', taskIds)

    if (tasksErr) {
      console.error('[goal-progress.get] tasks fetch error:', tasksErr.message)
      throw createError({ statusCode: 500, message: 'Error fetching linked tasks' })
    }

    const taskList = tasks || []
    const completedCount = taskList.filter(t => {
      const col = t.kanban_columns as { is_done: boolean } | null
      return col?.is_done === true
    }).length

    // Override computed values with task-based progress
    current_value = completedCount
    target_value = taskList.length
    linked_entities = taskList.length
  }

  const percent = target_value > 0
    ? Math.min(100, Math.round((current_value / target_value) * 100))
    : 0

  return {
    current_value,
    target_value,
    percent,
    linked_entities,
    status: goal.status,
  }
})
