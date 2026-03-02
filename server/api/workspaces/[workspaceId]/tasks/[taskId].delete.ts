import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const taskId = getRouterParam(event, 'taskId')
  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to a project in this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, project_id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task || (task as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw createError({ statusCode: 500, message: 'Error deleting task' })

  return { success: true }
})
