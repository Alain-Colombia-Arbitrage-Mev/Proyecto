import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const query = getQuery(event)
  const status = query.status as string || 'scheduled'

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', status)
    .order('scheduled_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[meetings.get] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error fetching meetings' })
  }

  return meetings || []
})
