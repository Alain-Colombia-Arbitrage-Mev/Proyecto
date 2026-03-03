import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { meetingInvitationEmailHtml } from '~~/server/utils/email'
import { generateGoogleMeetLink } from '~~/server/utils/meetings'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)

  if (!body.title) throw createError({ statusCode: 400, message: 'title is required' })
  if (!body.scheduled_at) throw createError({ statusCode: 400, message: 'scheduled_at is required' })

  const supabase = serverSupabaseServiceRole(event)

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
  const attendees: string[] = meeting.attendees || []
  for (const attendeeId of attendees) {
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
