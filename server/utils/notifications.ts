import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { sendEmail } from './email'
import { sendPushNotification } from './firebase'

interface NotifyUserOptions {
  event: H3Event
  userId: string
  type: string
  title: string
  body: string
  entityType?: string
  entityId?: string
  emailSubject?: string
  emailHtml?: string
}

/**
 * Unified notification helper: inserts in-app notification + fire-and-forget email & push.
 */
export async function notifyUser(opts: NotifyUserOptions): Promise<void> {
  const supabase = serverSupabaseServiceRole(opts.event)

  // 1. Insert in-app notification
  await supabase.from('notifications').insert({
    user_id: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    entity_type: opts.entityType || null,
    entity_id: opts.entityId || null,
  })

  // 2. Send email
  if (opts.emailSubject && opts.emailHtml) {
    try {
      const email = await getUserEmail(supabase, opts.userId)
      if (email) {
        await sendEmail({ to: email, subject: opts.emailSubject, html: opts.emailHtml })
      } else {
        console.warn(`[notifyUser] No email found for user ${opts.userId}`)
      }
    } catch (err) {
      console.error(`[notifyUser] Email failed for user ${opts.userId}:`, err)
    }
  }

  // 3. Push notification (fire-and-forget)
  try {
    const { data } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', opts.userId)
    if (data && data.length > 0) {
      const tokens = data.map(r => r.token)
      sendPushNotification(tokens, { title: opts.title, body: opts.body }).catch(() => {})
    }
  } catch {}
}

async function getUserEmail(supabase: any, userId: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId)
    return data?.user?.email || null
  } catch {
    return null
  }
}
