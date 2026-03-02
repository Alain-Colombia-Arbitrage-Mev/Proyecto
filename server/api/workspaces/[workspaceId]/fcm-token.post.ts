import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)
  const body = await readBody(event)

  const token = body.token
  if (typeof token !== 'string' || token.length < 10) {
    throw createError({ statusCode: 400, message: 'Invalid FCM token' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Upsert: one token per user+device (token is unique)
  const { error } = await supabase
    .from('fcm_tokens')
    .upsert(
      { user_id: user.id, token, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    )

  if (error) {
    console.error('[fcm-token] Upsert failed:', error.message)
    throw createError({ statusCode: 500, message: 'Failed to save token' })
  }

  return { ok: true }
})
