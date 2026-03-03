import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to this workspace via project
  const { data: task } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (!task) throw createError({ statusCode: 404, message: 'Task not found' })

  const { data, error } = await supabase
    .from('task_checklist')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: 'Error fetching checklist' })
  return data || []
})
