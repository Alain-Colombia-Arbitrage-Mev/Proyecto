import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const projectId = getRouterParam(event, 'projectId')
  const supabase = serverSupabaseServiceRole(event)

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .single()
  if (projErr) throw createError({ statusCode: 404, message: 'Project not found' })

  const [{ data: columns }, { data: tasks }] = await Promise.all([
    supabase
      .from('kanban_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('position'),
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position'),
  ])

  // Fetch task labels separately
  const taskIds = (tasks || []).map(t => t.id)
  let taskLabels: any[] = []
  if (taskIds.length > 0) {
    const { data } = await supabase
      .from('task_labels')
      .select('task_id, labels(*)')
      .in('task_id', taskIds)
    taskLabels = data || []
  }

  // Build a map of task_id -> labels
  const labelsByTask: Record<string, any[]> = {}
  for (const tl of taskLabels) {
    if (!labelsByTask[tl.task_id]) labelsByTask[tl.task_id] = []
    if (tl.labels) labelsByTask[tl.task_id]!.push(tl.labels)
  }

  // Attach labels to each task
  const tasksWithLabels = (tasks || []).map(t => ({
    ...t,
    labels: labelsByTask[t.id] || [],
  }))

  return {
    project,
    columns: columns || [],
    tasks: tasksWithLabels,
  }
})
