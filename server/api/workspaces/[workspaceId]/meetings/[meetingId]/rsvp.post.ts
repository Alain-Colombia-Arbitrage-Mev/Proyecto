import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const meetingId = getRouterParam(event, 'meetingId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const status = body.status

  if (!['accepted', 'declined'].includes(status)) {
    throw createError({ statusCode: 400, message: 'status must be "accepted" or "declined"' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify meeting exists and user is an attendee
  const { data: meeting, error: meetErr } = await supabase
    .from('meetings')
    .select('id, title, attendees, created_by, workspace_id')
    .eq('id', meetingId)
    .eq('workspace_id', workspaceId)
    .single()

  if (meetErr || !meeting) {
    throw createError({ statusCode: 404, message: 'Meeting not found' })
  }

  const allInvited = [...new Set([...(meeting.attendees || []), meeting.created_by])]
  if (!allInvited.includes(user.id)) {
    throw createError({ statusCode: 403, message: 'You are not invited to this meeting' })
  }

  // Upsert RSVP
  const { data: rsvp, error } = await supabase
    .from('meeting_rsvp')
    .upsert({
      meeting_id: meetingId,
      user_id: user.id,
      status,
      responded_at: new Date().toISOString(),
    }, { onConflict: 'meeting_id,user_id' })
    .select()
    .single()

  if (error) {
    console.error('[rsvp.post] Error:', error.message)
    throw createError({ statusCode: 500, message: `Error saving RSVP: ${error.message}` })
  }

  // Notify the meeting creator
  if (meeting.created_by !== user.id) {
    let userName = 'Alguien'
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(user.id)
      userName = profile?.user?.user_metadata?.full_name || profile?.user?.email?.split('@')[0] || 'Alguien'
    } catch {}

    const action = status === 'accepted' ? 'aceptó' : 'rechazó'

    notifyUser({
      event,
      userId: meeting.created_by,
      type: 'meeting_rsvp',
      title: `${userName} ${action} la reunión`,
      body: `${userName} ${action} la invitación a "${meeting.title}"`,
      entityType: 'meeting',
      entityId: meetingId,
    }).catch(err => console.error('[rsvp.post] notifyUser failed:', err))
  }

  return rsvp
})
