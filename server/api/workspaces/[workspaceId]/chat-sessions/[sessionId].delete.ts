import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const sessionId = getRouterParam(event, 'sessionId')!
  const user = await requireUser(event)

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
