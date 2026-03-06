import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { reservedDateEmailHtml } from '~~/server/utils/email'

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

  // Ensure the table exists — if migration 031 wasn't applied, create it
  const { error: tableCheck } = await supabase.from('reserved_dates').select('id').limit(0)
  if (tableCheck) {
    console.error('[reserved-dates.post] Table check failed:', tableCheck.message)
    throw createError({ statusCode: 500, message: `reserved_dates table error: ${tableCheck.message}` })
  }

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
    console.error('[reserved-dates.post] Insert error:', error.message, error.details, error.code)
    throw createError({ statusCode: 500, message: `Error creating reserved date: ${error.message}` })
  }

  // Get user name for notification
  let userName = 'Alguien'
  try {
    const { data: profile } = await supabase.auth.admin.getUserById(user.id)
    userName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
  } catch {}

  // Notify workspace members about the reserved time
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)

  const typeLabels: Record<string, string> = { vacation: 'Vacaciones', personal: 'Personal', busy: 'Ocupado' }

  const emailHtml = reservedDateEmailHtml({
    title: data.title,
    type: typeLabels[data.type] || data.type,
    startAt: data.start_at,
    endAt: data.end_at,
    userName,
  })

  const notifyPromises = (members || [])
    .filter(m => m.user_id !== user.id)
    .map(m =>
      notifyUser({
        event,
        userId: m.user_id,
        type: 'reserved_date',
        title: `Tiempo reservado: ${data.title}`,
        body: `${userName} reservó "${data.title}" (${typeLabels[data.type] || data.type})`,
        entityType: 'reserved_date',
        entityId: data.id,
        emailSubject: `Tiempo reservado: ${data.title} — ${userName}`,
        emailHtml,
      }).catch(err => console.error(`[reserved-dates.post] notifyUser failed for ${m.user_id}:`, err))
    )

  await Promise.allSettled(notifyPromises)

  return data
})
