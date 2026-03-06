import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const sessionId = getRouterParam(event, 'sessionId')!
  const user = await requireUser(event)

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) throw createError({ statusCode: 404, message: 'Session not found' })

  return data
})
