import { serverSupabaseServiceRole } from '#supabase/server'
import { generateApiToken } from '~~/server/utils/apiTokens'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Token name is required' })
  }

  const scopes: string[] = body.scopes || ['read']
  const validScopes = ['read', 'write', 'admin']
  for (const s of scopes) {
    if (!validScopes.includes(s)) {
      throw createError({ statusCode: 400, message: `Invalid scope: ${s}` })
    }
  }

  const { token, hash, prefix } = generateApiToken()

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('api_tokens')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      name: body.name.trim(),
      token_hash: hash,
      token_prefix: prefix,
      scopes,
      expires_at: body.expires_at || null,
    })
    .select('id, name, token_prefix, scopes, created_at')
    .single()

  if (error) {
    console.error('[api-tokens.post] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error creating token' })
  }

  // Return the full token ONLY on creation — never stored or shown again
  return { ...data, token }
})
