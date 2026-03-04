import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requirePermission(event, workspaceId, 'manage_reserved_dates')

  const body = await readBody(event)

  if (!body.title) throw createError({ statusCode: 400, message: 'title is required' })
  if (!body.start_at) throw createError({ statusCode: 400, message: 'start_at is required' })
  if (!body.end_at) throw createError({ statusCode: 400, message: 'end_at is required' })

  const validTypes = ['vacation', 'personal', 'busy']
  const type = validTypes.includes(body.type) ? body.type : 'busy'

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('reserved_dates')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      title: body.title,
      start_at: body.start_at,
      end_at: body.end_at,
      type,
    })
    .select()
    .single()

  if (error) {
    console.error('[reserved-dates.post] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error creating reserved date' })
  }

  return data
})
