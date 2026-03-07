import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const meetingId = getRouterParam(event, 'meetingId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('meeting_rsvp')
    .select('id, meeting_id, user_id, status, responded_at')
    .eq('meeting_id', meetingId)

  if (error) {
    console.error('[rsvp.get] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error fetching RSVP' })
  }

  return data || []
})
