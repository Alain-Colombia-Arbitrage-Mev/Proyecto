import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Personal focus view: the user's assigned tasks across all workspace projects,
 * bucketed into overdue / due today / upcoming (7 days).
 * Tasks sitting in each project's final column are considered done and excluded.
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)
  const supabase = serverSupabaseServiceRole(event)

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('workspace_id', workspaceId)
    .neq('status', 'completed')

  const projectIds = (projects || []).map((p: any) => p.id)
  if (projectIds.length === 0) return { overdue: [], today: [], upcoming: [] }

  const [{ data: tasks }, { data: columns }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, title_en, description, priority, due_date, estimated_hours, project_id, column_id, tags')
      .in('project_id', projectIds)
      .contains('assignees', [user.id])
      .limit(300),
    supabase
      .from('kanban_columns')
      .select('id, project_id, position')
      .in('project_id', projectIds)
      .order('position'),
  ])

  // Last column per project = done bucket
  const lastColumnByProject = new Map<string, string>()
  for (const col of columns || []) {
    lastColumnByProject.set(col.project_id, col.id) // ordered asc → last write wins
  }

  const projectMap = new Map((projects || []).map((p: any) => [p.id, p]))
  const today = new Date().toISOString().slice(0, 10)
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const overdue: any[] = []
  const todayList: any[] = []
  const upcoming: any[] = []

  for (const task of tasks || []) {
    if (lastColumnByProject.get(task.project_id) === task.column_id) continue
    const proj = projectMap.get(task.project_id)
    const enriched = { ...task, project_name: proj?.name || '', project_color: proj?.color || '#0ea5e9' }
    if (!task.due_date) continue
    const due = String(task.due_date).slice(0, 10)
    if (due < today) overdue.push(enriched)
    else if (due === today) todayList.push(enriched)
    else if (due <= in7days) upcoming.push(enriched)
  }

  const byDue = (a: any, b: any) => String(a.due_date).localeCompare(String(b.due_date))
  overdue.sort(byDue)
  todayList.sort(byDue)
  upcoming.sort(byDue)

  return { overdue, today: todayList, upcoming }
})
