import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'view_goals')

  const query = getQuery(event)
  const supabase = serverSupabaseServiceRole(event)

  let q = supabase
    .from('goals')
    .select('*, goal_links(id, entity_type, entity_id)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (query.status) {
    q = q.eq('status', query.status as string)
  }
  if (query.goal_type) {
    q = q.eq('goal_type', query.goal_type as string)
  }
  if (query.owner_id) {
    q = q.eq('owner_id', query.owner_id as string)
  }

  const { data, error } = await q

  if (error) {
    console.error('[goals.get] fetch error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error fetching goals' })
  }

  return data || []
})
