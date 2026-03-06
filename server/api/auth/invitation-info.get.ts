import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const inviteId = query.id as string

  if (!inviteId) throw createError({ statusCode: 400, message: 'Missing invitation id' })

  const supabase = serverSupabaseServiceRole(event)

  const { data: invite, error } = await supabase
    .from('workspace_invitations')
    .select('id, email, role, status, workspace_id, invited_by')
    .eq('id', inviteId)
    .eq('status', 'pending')
    .maybeSingle()

  if (error || !invite) {
    throw createError({ statusCode: 404, message: 'Invitation not found or expired' })
  }

  // Get workspace name
  const { data: ws } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', invite.workspace_id)
    .maybeSingle()

  // Get inviter name
  let invitedByName = ''
  if (invite.invited_by) {
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(invite.invited_by)
      invitedByName = profile?.user?.user_metadata?.full_name || profile?.user?.email || ''
    } catch {}
  }

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    workspace_name: ws?.name || '',
    invited_by_name: invitedByName,
  }
})
