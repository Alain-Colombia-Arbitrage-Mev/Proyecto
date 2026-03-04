import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()

  // Get all projects in workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)

  const projectIds = (projects || []).map(p => p.id)
  if (projectIds.length === 0) return []

  // Get columns to detect "done" columns (highest position per project)
  const { data: cols } = await supabase
    .from('kanban_columns')
    .select('id, project_id, position')
    .in('project_id', projectIds)
    .order('position', { ascending: false })

  const doneColIds = new Set<string>()
  const seenProjects = new Set<string>()
  for (const col of cols || []) {
    if (!seenProjects.has(col.project_id)) {
      seenProjects.add(col.project_id)
      doneColIds.add(col.id)
    }
  }

  // Get all tasks with relevant fields
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, column_id, assignees, due_date, estimated_hours, tracked_hours, column_entered_at, last_activity_at, created_at')
    .in('project_id', projectIds)

  // Get workspace members
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId)

  // Get quiz scores
  const { data: assessments } = await supabase
    .from('user_assessments')
    .select('user_id, score')
    .eq('workspace_id', workspaceId)
    .eq('assessment_type', 'procrastination')

  const quizMap = new Map<string, number>()
  for (const a of assessments || []) {
    quizMap.set(a.user_id, a.score)
  }

  // Group tasks by assignee
  const tasksByUser = new Map<string, typeof tasks>()
  for (const m of members || []) {
    tasksByUser.set(m.user_id, [])
  }

  for (const task of tasks || []) {
    const assignees: string[] = task.assignees || []
    for (const uid of assignees) {
      if (!tasksByUser.has(uid)) tasksByUser.set(uid, [])
      tasksByUser.get(uid)!.push(task)
    }
  }

  // Calculate metrics per member
  const results = []

  for (const member of members || []) {
    const uid = member.user_id
    const userTasks = tasksByUser.get(uid) || []

    if (userTasks.length === 0) {
      results.push({
        user_id: uid,
        total_tasks: 0,
        procrastination_index: null,
        overdue_rate: null,
        late_completion_rate: null,
        stagnation_score: null,
        effort_gap: null,
        quiz_score: quizMap.get(uid) ?? null,
      })
      continue
    }

    // 1. Overdue Rate - % of tasks with due_date < now that are NOT in done column
    const tasksWithDueDate = userTasks.filter(t => t.due_date)
    let overdueRate = 0
    if (tasksWithDueDate.length > 0) {
      const overdueCount = tasksWithDueDate.filter(t => {
        const dueDate = new Date(t.due_date!)
        const isOverdue = dueDate < now
        const isNotDone = !doneColIds.has(t.column_id || '')
        return isOverdue && isNotDone
      }).length
      overdueRate = (overdueCount / tasksWithDueDate.length) * 100
    }

    // 2. Late Completion Rate - % of completed tasks where column_entered_at > due_date
    const completedWithDue = userTasks.filter(t =>
      doneColIds.has(t.column_id || '') && t.due_date,
    )
    let lateCompletionRate = 0
    if (completedWithDue.length > 0) {
      const lateCount = completedWithDue.filter(t => {
        const entered = new Date(t.column_entered_at)
        const due = new Date(t.due_date!)
        return entered > due
      }).length
      lateCompletionRate = (lateCount / completedWithDue.length) * 100
    }

    // 3. Stagnation Score - avg days without activity on open tasks (cap 30 days = 100)
    const openTasks = userTasks.filter(t => !doneColIds.has(t.column_id || ''))
    let stagnationScore = 0
    if (openTasks.length > 0) {
      const totalDays = openTasks.reduce((sum, t) => {
        const lastActivity = new Date(t.last_activity_at || t.created_at)
        const daysSince = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        return sum + Math.min(daysSince, 30)
      }, 0)
      stagnationScore = (totalDays / openTasks.length / 30) * 100
    }

    // 4. Effort Gap - ratio tracked_hours / estimated_hours inverted
    const tasksWithEstimate = userTasks.filter(t =>
      t.estimated_hours && t.estimated_hours > 0,
    )
    let effortGap = 0
    if (tasksWithEstimate.length > 0) {
      const totalEstimated = tasksWithEstimate.reduce((s, t) => s + (t.estimated_hours || 0), 0)
      const totalTracked = tasksWithEstimate.reduce((s, t) => s + (t.tracked_hours || 0), 0)
      if (totalEstimated > 0) {
        const ratio = totalTracked / totalEstimated
        // ratio < 1 means under-tracking (possible procrastination)
        // Invert: gap = (1 - ratio) * 100, clamped 0-100
        effortGap = Math.max(0, Math.min(100, (1 - ratio) * 100))
      }
    }

    // Weighted index
    const quizScore = quizMap.get(uid) ?? null
    let index: number

    if (quizScore !== null) {
      // Mix quiz at 15%, reduce others proportionally
      index =
        overdueRate * 0.255 +
        lateCompletionRate * 0.2125 +
        stagnationScore * 0.2125 +
        effortGap * 0.17 +
        quizScore * 0.15
    } else {
      index =
        overdueRate * 0.30 +
        lateCompletionRate * 0.25 +
        stagnationScore * 0.25 +
        effortGap * 0.20
    }

    results.push({
      user_id: uid,
      total_tasks: userTasks.length,
      procrastination_index: Math.round(index * 10) / 10,
      overdue_rate: Math.round(overdueRate * 10) / 10,
      late_completion_rate: Math.round(lateCompletionRate * 10) / 10,
      stagnation_score: Math.round(stagnationScore * 10) / 10,
      effort_gap: Math.round(effortGap * 10) / 10,
      quiz_score: quizScore,
    })
  }

  return results
})
