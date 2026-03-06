import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'manage_workflows')

  const workflowId = getRouterParam(event, 'workflowId')!
  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { success: true }
})
