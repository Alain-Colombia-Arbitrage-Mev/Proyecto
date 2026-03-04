import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { meetingInvitationEmailHtml } from '~~/server/utils/email'
import { generateGoogleMeetLink } from '~~/server/utils/meetings'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requirePermission(event, workspaceId, 'create_meetings')

  const body = await readBody(event)

  if (!body.title) throw createError({ statusCode: 400, message: 'title is required' })
  if (!body.scheduled_at) throw createError({ statusCode: 400, message: 'scheduled_at is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Check for conflicts with reserved dates
  const attendees: string[] = body.attendees || []
  if (attendees.length > 0 && body.scheduled_at) {
    const meetingEnd = new Date(new Date(body.scheduled_at).getTime() + (body.duration_minutes || 30) * 60000).toISOString()

    const { data: conflicts } = await supabase
      .from('reserved_dates')
      .select('id, user_id, title, type, start_at, end_at')
      .eq('workspace_id', workspaceId)
      .in('user_id', attendees)
      .lt('start_at', meetingEnd)
      .gt('end_at', body.scheduled_at)

    if (conflicts && conflicts.length > 0) {
      // Get emails for conflicting users
      const conflictDetails = []
      for (const c of conflicts) {
        let email = c.user_id
        try {
          const { data: profile } = await supabase.auth.admin.getUserById(c.user_id)
          email = profile?.user?.email || c.user_id
        } catch {}
        conflictDetails.push({ user: email, title: c.title, type: c.type, start_at: c.start_at, end_at: c.end_at })
      }

      throw createError({
        statusCode: 409,
        message: `Conflict: ${conflictDetails.map(c => `${c.user} (${c.type}: ${c.title})`).join(', ')}`,
        data: { conflicts: conflictDetails },
      })
    }
  }

  // Generate Google Meet link
  const meetingUrl = body.meeting_url || generateGoogleMeetLink()

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      workspace_id: workspaceId,
      project_id: body.project_id || null,
      created_by: user.id,
      title: body.title,
      description: body.description || null,
      meeting_url: meetingUrl,
      platform: body.platform || 'google_meet',
      scheduled_at: body.scheduled_at,
      duration_minutes: body.duration_minutes || 30,
      attendees: body.attendees || [],
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) {
    console.error('[meetings.post] Insert error:', error.message)
    throw createError({ statusCode: 500, message: 'Error creating meeting' })
  }

  // Get organizer name
  let organizerName = 'Alguien'
  try {
    const { data: profile } = await supabase.auth.admin.getUserById(user.id)
    organizerName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
  } catch {}

  // Get project name if applicable
  let projectName: string | undefined
  if (body.project_id) {
    const { data: proj } = await supabase
      .from('projects')
      .select('name')
      .eq('id', body.project_id)
      .maybeSingle()
    projectName = proj?.name
  }

  // Send email invitations to all attendees (fire-and-forget)
  const meetingAttendees: string[] = meeting.attendees || []
  for (const attendeeId of meetingAttendees) {
    if (attendeeId === user.id) continue

    const emailHtml = meetingInvitationEmailHtml({
      title: meeting.title,
      description: meeting.description,
      scheduledAt: meeting.scheduled_at,
      durationMinutes: meeting.duration_minutes,
      meetingUrl: meeting.meeting_url,
      organizerName,
      projectName,
    })

    notifyUser({
      event,
      userId: attendeeId,
      type: 'meeting_scheduled',
      title: `Reunión: ${meeting.title}`,
      body: `${organizerName} programó "${meeting.title}" para ${new Date(meeting.scheduled_at).toLocaleDateString('es-ES')}`,
      entityType: 'meeting',
      entityId: meeting.id,
      emailSubject: `Reunión programada: ${meeting.title}`,
      emailHtml,
    }).catch(() => {})
  }

  return meeting
})
