import { serverSupabaseServiceRole } from '#supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  try {
    const workspaceId = getRouterParam(event, 'workspaceId')!
    const { user } = await requireWorkspaceMember(event, workspaceId)
    const body = await readBody(event)
    const supabase = serverSupabaseServiceRole(event)

    if (body.markAllRead === true) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) console.warn('[notifications] markAllRead error:', error.message)
      return { ok: true }
    }

    if (typeof body.id === 'string' && UUID_RE.test(body.id)) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', body.id)
        .eq('user_id', user.id)

      if (error) console.warn('[notifications] markRead error:', error.message)
      return { ok: true }
    }

    throw createError({ statusCode: 400, message: 'Invalid request: provide { markAllRead: true } or { id: "<uuid>" }' })
  } catch (err: any) {
    if (err?.statusCode === 401 || err?.statusCode === 400) throw err
    console.warn('[notifications] patch error:', err?.message || err)
    return { ok: true }
  }
})
