import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const meetingId = getRouterParam(event, 'meetingId')!
  const { user } = await requirePermission(event, workspaceId, 'create_meetings')

  const supabase = serverSupabaseServiceRole(event)

  // Fetch meeting before deleting (to notify attendees)
  const { data: meeting, error: fetchErr } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .eq('workspace_id', workspaceId)
    .single()

  if (fetchErr || !meeting) {
    throw createError({ statusCode: 404, message: 'Meeting not found' })
  }

  // Delete the meeting
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('[meetings.delete] Error:', error.message)
    throw createError({ statusCode: 500, message: `Error deleting meeting: ${error.message}` })
  }

  // Notify attendees about cancellation
  let organizerName = 'Alguien'
  try {
    const { data: profile } = await supabase.auth.admin.getUserById(user.id)
    organizerName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
  } catch {}

  const attendees: string[] = meeting.attendees || []
  const notifyPromises = attendees
    .filter(id => id !== user.id)
    .map(attendeeId =>
      notifyUser({
        event,
        userId: attendeeId,
        type: 'meeting_cancelled',
        title: `Reunión cancelada: ${meeting.title}`,
        body: `${organizerName} canceló la reunión "${meeting.title}"`,
        entityType: 'meeting',
        entityId: meeting.id,
      }).catch(err => console.error(`[meetings.delete] notifyUser failed for ${attendeeId}:`, err))
    )

  await Promise.allSettled(notifyPromises)

  return { success: true }
})
