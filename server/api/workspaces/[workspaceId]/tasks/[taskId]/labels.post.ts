import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const body = await readBody(event)
  if (!body.label_id) {
    throw createError({ statusCode: 400, message: 'label_id is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task || (task as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  // Verify label belongs to workspace
  const { data: label } = await supabase
    .from('labels')
    .select('id')
    .eq('id', body.label_id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!label) {
    throw createError({ statusCode: 404, message: 'Label not found in this workspace' })
  }

  const { error } = await supabase
    .from('task_labels')
    .upsert({ task_id: taskId, label_id: body.label_id })

  if (error) throw createError({ statusCode: 500, message: 'Error attaching label' })
  return { success: true }
})
