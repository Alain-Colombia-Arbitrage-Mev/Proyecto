import { serverSupabaseServiceRole } from '#supabase/server'
import { sendEmail, meetingReminderEmailHtml } from '~~/server/utils/email'
import { sendPushNotification } from '~~/server/utils/firebase'

/**
 * Cron job: send meeting reminders 10 minutes before scheduled time.
 * Should be called every ~2 minutes by an external cron (Supabase pg_cron, Vercel cron, etc.)
 *
 * POST /api/cron/meeting-reminders
 * Body: { cronSecret: string }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Auth: cronSecret or authenticated user
  const isCron = typeof body.cronSecret === 'string' && body.cronSecret.length > 0 && body.cronSecret === config.cronSecret
  if (!isCron) {
    try {
      await requireUser(event)
    } catch {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  }

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()

  // Window: meetings starting between now and 12 minutes from now
  // (gives a 2-minute buffer so cron running every 2 min doesn't miss any)
  const windowStart = now.toISOString()
  const windowEnd = new Date(now.getTime() + 12 * 60 * 1000).toISOString()

  // Find scheduled meetings in the reminder window
  const { data: meetings, error: meetErr } = await supabase
    .from('meetings')
    .select('id, title, scheduled_at, duration_minutes, meeting_url, attendees, created_by')
    .eq('status', 'scheduled')
    .gte('scheduled_at', windowStart)
    .lte('scheduled_at', windowEnd)
    .limit(100)

  if (meetErr) {
    console.error('[cron/meeting-reminders] Query failed:', meetErr.message)
    return { checked: 0, reminders: 0, error: 'query_failed' }
  }

  if (!meetings || meetings.length === 0) {
    return { checked: 0, reminders: 0 }
  }

  // Collect all unique user IDs (attendees + creators)
  const allUserIds = [...new Set(meetings.flatMap(m => [...(m.attendees || []), m.created_by]))]
  const meetingIds = meetings.map(m => m.id)

  // Check which reminders have already been sent (avoid duplicates)
  const existingSet = new Set<string>()
  if (meetingIds.length > 0 && allUserIds.length > 0) {
    const { data: existing } = await supabase
      .from('notifications')
      .select('user_id, entity_id')
      .in('entity_id', meetingIds)
      .in('user_id', allUserIds)
      .eq('type', 'meeting_reminder')

    for (const n of existing || []) {
      existingSet.add(`${n.user_id}:${n.entity_id}`)
    }
  }

  // Batch fetch user emails
  const userEmailMap = new Map<string, string>()
  if (allUserIds.length > 0) {
    const results = await Promise.allSettled(
      allUserIds.map(userId =>
        supabase.auth.admin.getUserById(userId).then(r => ({ userId, email: r.data?.user?.email }))
      )
    )
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.email) {
        userEmailMap.set(r.value.userId, r.value.email)
      }
    }
  }

  // Batch fetch FCM tokens
  const tokensByUser = new Map<string, string[]>()
  if (allUserIds.length > 0) {
    const { data: fcmRows } = await supabase
      .from('fcm_tokens')
      .select('user_id, token')
      .in('user_id', allUserIds)

    for (const row of fcmRows || []) {
      const tokens = tokensByUser.get(row.user_id) || []
      tokens.push(row.token)
      tokensByUser.set(row.user_id, tokens)
    }
  }

  // Build notifications, emails, and push jobs
  const notificationsToInsert: Array<{
    user_id: string
    type: string
    title: string
    body: string
    entity_type: string
    entity_id: string
  }> = []

  interface EmailJob { to: string; subject: string; html: string }
  const emailJobs: EmailJob[] = []
  const pushJobs: Array<{ tokens: string[]; title: string; body: string }> = []

  for (const meeting of meetings) {
    const minutesBefore = Math.max(1, Math.round((new Date(meeting.scheduled_at).getTime() - now.getTime()) / 60000))
    const allAttendees: string[] = [...new Set([...(meeting.attendees || []), meeting.created_by])]

    const notifTitle = `Reunión en ${minutesBefore} min: ${meeting.title}`
    const notifBody = `"${meeting.title}" comienza pronto. Únete aquí: ${meeting.meeting_url}`

    const emailHtml = meetingReminderEmailHtml({
      title: meeting.title,
      scheduledAt: meeting.scheduled_at,
      durationMinutes: meeting.duration_minutes,
      meetingUrl: meeting.meeting_url,
      minutesBefore,
    })

    for (const userId of allAttendees) {
      const dupeKey = `${userId}:${meeting.id}`
      if (existingSet.has(dupeKey)) continue

      notificationsToInsert.push({
        user_id: userId,
        type: 'meeting_reminder',
        title: notifTitle,
        body: notifBody,
        entity_type: 'meeting',
        entity_id: meeting.id,
      })
      existingSet.add(dupeKey)

      // Email
      const email = userEmailMap.get(userId)
      if (email) {
        emailJobs.push({
          to: email,
          subject: `${meeting.title} — comienza en ${minutesBefore} minutos`,
          html: emailHtml,
        })
      }

      // Push
      const tokens = tokensByUser.get(userId)
      if (tokens && tokens.length > 0) {
        pushJobs.push({
          tokens,
          title: notifTitle,
          body: notifBody,
        })
      }
    }
  }

  // Batch insert notifications
  let notificationsCreated = 0
  if (notificationsToInsert.length > 0) {
    const { error: insertErr } = await supabase
      .from('notifications')
      .insert(notificationsToInsert)

    if (insertErr) {
      console.error('[cron/meeting-reminders] Notification insert failed:', insertErr.message)
    } else {
      notificationsCreated = notificationsToInsert.length
    }
  }

  // Send emails (awaited to ensure delivery)
  let emailsSent = 0
  if (emailJobs.length > 0) {
    const results = await Promise.allSettled(emailJobs.map(job => sendEmail(job)))
    emailsSent = results.filter(r => r.status === 'fulfilled' && r.value === true).length
  }

  // Send push notifications
  let pushSent = 0
  if (pushJobs.length > 0) {
    const results = await Promise.allSettled(
      pushJobs.map(job => sendPushNotification(job.tokens, { title: job.title, body: job.body }))
    )
    pushSent = results.reduce((sum, r) => sum + (r.status === 'fulfilled' ? r.value : 0), 0)
  }

  console.info(`[cron/meeting-reminders] meetings=${meetings.length} notifications=${notificationsCreated} emails=${emailsSent} push=${pushSent}`)

  return {
    checked: meetings.length,
    notificationsCreated,
    emailsSent,
    pushSent,
  }
})
