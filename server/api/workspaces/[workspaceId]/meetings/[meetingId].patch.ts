import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { meetingInvitationEmailHtml } from '~~/server/utils/email'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const meetingId = getRouterParam(event, 'meetingId')!
  const { user } = await requirePermission(event, workspaceId, 'create_meetings')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  // Fetch existing meeting
  const { data: existing, error: fetchErr } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .eq('workspace_id', workspaceId)
    .single()

  if (fetchErr || !existing) {
    throw createError({ statusCode: 404, message: 'Meeting not found' })
  }

  // Build update payload (only allowed fields)
  const update: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) update.title = body.title
  if (body.description !== undefined) update.description = body.description
  if (body.scheduled_at !== undefined) update.scheduled_at = body.scheduled_at
  if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes
  if (body.status !== undefined) update.status = body.status

  const { data: meeting, error } = await supabase
    .from('meetings')
    .update(update)
    .eq('id', meetingId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) {
    console.error('[meetings.patch] Update error:', error.message)
    throw createError({ statusCode: 500, message: `Error updating meeting: ${error.message}` })
  }

  // Notify attendees if the meeting was rescheduled
  const wasRescheduled = body.scheduled_at && body.scheduled_at !== existing.scheduled_at
  if (wasRescheduled) {
    let organizerName = 'Alguien'
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(user.id)
      organizerName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
    } catch {}

    let projectName: string | undefined
    if (meeting.project_id) {
      const { data: proj } = await supabase
        .from('projects')
        .select('name')
        .eq('id', meeting.project_id)
        .maybeSingle()
      projectName = proj?.name
    }

    const emailHtml = meetingInvitationEmailHtml({
      title: meeting.title,
      description: meeting.description,
      scheduledAt: meeting.scheduled_at,
      durationMinutes: meeting.duration_minutes,
      meetingUrl: meeting.meeting_url,
      organizerName,
      projectName,
    })

    const attendees: string[] = meeting.attendees || []
    const notifyPromises = attendees
      .filter(id => id !== user.id)
      .map(attendeeId =>
        notifyUser({
          event,
          userId: attendeeId,
          type: 'meeting_rescheduled',
          title: `Reunión aplazada: ${meeting.title}`,
          body: `${organizerName} reprogramó "${meeting.title}" para ${new Date(meeting.scheduled_at).toLocaleDateString('es-ES')}`,
          entityType: 'meeting',
          entityId: meeting.id,
          emailSubject: `Reunión reprogramada: ${meeting.title}`,
          emailHtml,
        }).catch(err => console.error(`[meetings.patch] notifyUser failed for ${attendeeId}:`, err))
      )

    await Promise.allSettled(notifyPromises)
  }

  return meeting
})
