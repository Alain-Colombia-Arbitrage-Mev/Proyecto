import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'view_agenda')

  const query = getQuery(event)
  const from = query.from as string | undefined
  const to = query.to as string | undefined

  const supabase = serverSupabaseServiceRole(event)

  let q = supabase
    .from('reserved_dates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('start_at', { ascending: true })

  if (from) q = q.gte('start_at', from)
  if (to) q = q.lte('end_at', to)

  const { data, error } = await q

  if (error) {
    console.error('[reserved-dates.get] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error fetching reserved dates' })
  }

  return data || []
})
