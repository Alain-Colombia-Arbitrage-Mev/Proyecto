import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  if (!body.id) {
    throw createError({ statusCode: 400, message: 'Token id is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('api_tokens')
    .delete()
    .eq('id', body.id)
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[api-tokens.delete] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error deleting token' })
  }

  return { ok: true }
})
