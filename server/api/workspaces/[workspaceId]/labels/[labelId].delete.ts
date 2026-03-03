import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const labelId = getRouterParam(event, 'labelId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('labels')
    .delete()
    .eq('id', labelId)
    .eq('workspace_id', workspaceId)

  if (error) throw createError({ statusCode: 500, message: 'Error deleting label' })
  return { success: true }
})
