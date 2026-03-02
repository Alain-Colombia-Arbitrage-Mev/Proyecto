import { serverSupabaseServiceRole } from '#supabase/server'
import { sendEmail, deadlineEmailHtml } from '~~/server/utils/email'
import { sendPushNotification } from '~~/server/utils/firebase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Auth: cronSecret for server-side cron, or authenticated Supabase user for client-side
  const isCron = typeof body.cronSecret === 'string' && body.cronSecret.length > 0 && body.cronSecret === config.cronSecret
  if (!isCron) {
    // Client-side call: require a valid authenticated user via Supabase session
    try {
      await requireUser(event)
    } catch {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  }

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Find tasks with due_date in next 24h that have assignees
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('id, title, due_date, assignees, project_id')
    .gte('due_date', now.toISOString())
    .lte('due_date', in24h.toISOString())
    .not('assignees', 'eq', '{}')
    .limit(200)

  if (tasksErr) {
    console.error('[cron/check-deadlines] Query failed:', tasksErr.message)
    return { checked: 0, notificationsCreated: 0, error: 'query_failed' }
  }

  if (!tasks || tasks.length === 0) return { checked: 0, notificationsCreated: 0 }

  // Batch: collect all unique project IDs and user IDs to avoid N+1
  const projectIds = [...new Set(tasks.map(t => t.project_id))]
  const allUserIds = [...new Set(tasks.flatMap(t => t.assignees || []))]

  // Batch fetch project names
  const projectNameMap = new Map<string, string>()
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)
    for (const p of projects || []) {
      projectNameMap.set(p.id, p.name)
    }
  }

  // Batch fetch existing notifications to check duplicates in one query
  const taskIds = tasks.map(t => t.id)
  const existingNotifSet = new Set<string>()
  if (taskIds.length > 0 && allUserIds.length > 0) {
    const { data: existing } = await supabase
      .from('notifications')
      .select('user_id, entity_id, type')
      .in('entity_id', taskIds)
      .in('user_id', allUserIds)
      .in('type', ['deadline_urgent', 'deadline_approaching'])
    for (const n of existing || []) {
      existingNotifSet.add(`${n.user_id}:${n.entity_id}:${n.type}`)
    }
  }

  // Batch fetch user emails for email sending
  const userEmailMap = new Map<string, string>()
  for (const userId of allUserIds) {
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(userId)
      if (profile?.user?.email) {
        userEmailMap.set(userId, profile.user.email)
      }
    } catch {
      // Skip users we can't look up
    }
  }

  // Process tasks and build notification inserts in batch
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

  for (const task of tasks) {
    const dueDate = new Date(task.due_date)
    const hoursLeft = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const notifType = hoursLeft < 1 ? 'deadline_urgent' : 'deadline_approaching'
    const title = hoursLeft < 1
      ? `Tarea vence en menos de 1h: ${task.title}`
      : `Tarea vence pronto: ${task.title}`
    const notifBody = hoursLeft < 1
      ? `"${task.title}" vence en ${Math.round(hoursLeft * 60)} minutos`
      : `"${task.title}" vence en ${Math.round(hoursLeft)} horas`

    const projectName = projectNameMap.get(task.project_id) || 'Proyecto'

    for (const userId of task.assignees) {
      const dupeKey = `${userId}:${task.id}:${notifType}`
      if (existingNotifSet.has(dupeKey)) continue

      notificationsToInsert.push({
        user_id: userId,
        type: notifType,
        title,
        body: notifBody,
        entity_type: 'task',
        entity_id: task.id,
      })
      existingNotifSet.add(dupeKey) // Prevent duplicates within this batch

      const email = userEmailMap.get(userId)
      if (email) {
        emailJobs.push({
          to: email,
          subject: title,
          html: deadlineEmailHtml(task.title, task.due_date, projectName),
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
      console.error('[cron/check-deadlines] Notification insert failed:', insertErr.message)
    } else {
      notificationsCreated = notificationsToInsert.length
    }
  }

  // Fire-and-forget emails (don't block response)
  if (emailJobs.length > 0) {
    Promise.allSettled(emailJobs.map(job => sendEmail(job))).catch(() => {})
  }

  // Fire-and-forget FCM push notifications
  let pushSent = 0
  if (allUserIds.length > 0 && notificationsToInsert.length > 0) {
    // Batch fetch FCM tokens for all affected users
    const { data: fcmRows } = await supabase
      .from('fcm_tokens')
      .select('user_id, token')
      .in('user_id', allUserIds)

    if (fcmRows && fcmRows.length > 0) {
      // Group tokens by user
      const tokensByUser = new Map<string, string[]>()
      for (const row of fcmRows) {
        const tokens = tokensByUser.get(row.user_id) || []
        tokens.push(row.token)
        tokensByUser.set(row.user_id, tokens)
      }

      // Collect all push jobs: group by notification message to batch tokens
      const pushJobMap = new Map<string, { title: string; body: string; tokens: string[] }>()
      for (const notif of notificationsToInsert) {
        const userTokens = tokensByUser.get(notif.user_id)
        if (!userTokens || userTokens.length === 0) continue

        const key = `${notif.title}::${notif.body}`
        const existing = pushJobMap.get(key)
        if (existing) {
          existing.tokens.push(...userTokens)
        } else {
          pushJobMap.set(key, { title: notif.title, body: notif.body, tokens: [...userTokens] })
        }
      }

      // Send all push notifications fire-and-forget
      const pushPromises = [...pushJobMap.values()].map(job =>
        sendPushNotification(job.tokens, { title: job.title, body: job.body })
      )
      Promise.allSettled(pushPromises)
        .then(results => {
          const total = results.reduce((sum, r) => sum + (r.status === 'fulfilled' ? r.value : 0), 0)
          if (total > 0) console.info(`[cron/check-deadlines] FCM push sent=${total}`)
        })
        .catch(() => {})
    }
  }

  console.info(`[cron/check-deadlines] checked=${tasks.length} notifications=${notificationsCreated} emails=${emailJobs.length}`)

  return { checked: tasks.length, notificationsCreated, emailsSent: emailJobs.length }
})
