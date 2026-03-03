import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  const labelId = getRouterParam(event, 'labelId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId)

  if (error) throw createError({ statusCode: 500, message: 'Error removing label' })
  return { success: true }
})
