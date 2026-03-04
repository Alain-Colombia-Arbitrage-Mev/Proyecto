import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!

  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Proyecto no encontrado' })

  // Determine "done" column: highest position column in this project
  const { data: columns } = await supabase
    .from('kanban_columns')
    .select('id, position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })

  const doneColumnId = columns && columns.length > 0 ? columns[0].id : null

  // Total root-level tasks for this project
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('parent_task_id', null)

  // Completed tasks
  let completedTasks = 0
  if (doneColumnId) {
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('column_id', doneColumnId)
      .is('parent_task_id', null)

    completedTasks = count || 0
  }

  const total = totalTasks || 0
  const openTasks = total - completedTasks
  const completionRate = total > 0 ? Math.round((completedTasks / total) * 100) : 0

  // Average cycle time: time from task creation to moving into the done column.
  // Approximated by comparing created_at vs updated_at for completed tasks.
  // A more precise implementation would use a task_status_history table.
  let avgCycleTimeHours = 0
  if (completedTasks > 0 && doneColumnId) {
    const { data: doneTasks } = await supabase
      .from('tasks')
      .select('created_at, updated_at')
      .eq('project_id', projectId)
      .eq('column_id', doneColumnId)
      .is('parent_task_id', null)
      .not('updated_at', 'is', null)

    if (doneTasks && doneTasks.length > 0) {
      const totalMs = doneTasks.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime()
        const updated = new Date(t.updated_at).getTime()
        const diff = updated - created
        // Guard against negative values (clock skew / same-day completions)
        return sum + (diff > 0 ? diff : 0)
      }, 0)

      avgCycleTimeHours = Math.round((totalMs / doneTasks.length / (1000 * 60 * 60)) * 10) / 10
    }
  }

  // Total tracked time for this project
  const { data: timeData } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('project_id', projectId)

  const totalTimeMinutes = (timeData || []).reduce(
    (sum, row) => sum + (row.duration_minutes || 0),
    0
  )

  // Milestone progress
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('id, completed')
    .eq('project_id', projectId)

  const totalMilestones = (milestones || []).length
  const completedMilestones = (milestones || []).filter(m => m.completed).length
  const milestoneProgress = {
    total: totalMilestones,
    completed: completedMilestones,
    rate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
  }

  return {
    total_tasks: total,
    completed_tasks: completedTasks,
    open_tasks: openTasks,
    completion_rate: completionRate,
    avg_cycle_time_hours: avgCycleTimeHours,
    total_time_minutes: totalTimeMinutes,
    milestone_progress: milestoneProgress,
  }
})
