import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const user = await requireUser(event)

  const supabase = serverSupabaseServiceRole(event)

  const query = getQuery(event)
  const workflowId = query.workflow_id as string | undefined

  let q = supabase
    .from('chat_sessions')
    .select('id, title, workflow_id, created_at, updated_at, metadata')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (workflowId) {
    q = q.eq('workflow_id', workflowId)
  }

  const { data, error } = await q

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data || []
})
