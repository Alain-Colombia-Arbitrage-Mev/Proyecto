import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Fetch task and verify it belongs to this workspace via project
  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('*, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (taskErr) throw createError({ statusCode: 500, message: 'Error fetching task' })
  if (!task) throw createError({ statusCode: 404, message: 'Task not found' })

  // Fetch relations in parallel
  const [checklistRes, commentsRes, labelsRes] = await Promise.all([
    supabase
      .from('task_checklist')
      .select('*')
      .eq('task_id', taskId)
      .order('position', { ascending: true }),
    supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true }),
    supabase
      .from('task_labels')
      .select('label_id, labels(*)')
      .eq('task_id', taskId),
  ])

  // Strip the joined projects object
  const { projects: _p, ...taskData } = task

  return {
    task: taskData,
    checklist: checklistRes.data || [],
    comments: commentsRes.data || [],
    labels: (labelsRes.data || []).map(tl => tl.labels).filter(Boolean),
  }
})
