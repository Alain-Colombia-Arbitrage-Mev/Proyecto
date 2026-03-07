import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, name, token_prefix, scopes, last_used_at, expires_at, created_at')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api-tokens.get] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error fetching tokens' })
  }

  return data || []
})
