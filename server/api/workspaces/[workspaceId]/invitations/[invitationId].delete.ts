import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const invitationId = getRouterParam(event, 'invitationId')!
  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
