import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.id || !user?.email) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const body = await readBody(event)
  const inviteId = body.inviteId as string
  const action = body.action as string // 'accept' | 'decline'

  if (!inviteId) throw createError({ statusCode: 400, message: 'Missing inviteId' })
  if (!['accept', 'decline'].includes(action)) {
    throw createError({ statusCode: 400, message: 'action must be "accept" or "decline"' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Load invitation
  const { data: invite, error } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, project_ids, invited_by, status')
    .eq('id', inviteId)
    .maybeSingle()

  if (error || !invite) {
    throw createError({ statusCode: 404, message: 'Invitation not found' })
  }

  if (invite.status !== 'pending') {
    throw createError({ statusCode: 400, message: 'Invitation already processed' })
  }

  // Verify email matches
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw createError({ statusCode: 403, message: 'This invitation is not for you' })
  }

  // Get workspace slug for redirect
  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', invite.workspace_id)
    .maybeSingle()

  // ── DECLINE ──
  if (action === 'decline') {
    const { error: declineErr } = await supabase
      .from('workspace_invitations')
      .update({ status: 'declined', accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    if (declineErr) {
      console.error('[respond-invitation] Error declining:', declineErr.message)
      // Fallback: mark as cancelled if 'declined' is not in CHECK constraint yet
      await supabase
        .from('workspace_invitations')
        .update({ status: 'cancelled', accepted_at: new Date().toISOString() })
        .eq('id', invite.id)
    }

    return { ok: true, action: 'declined' }
  }

  // ── ACCEPT ──
  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: memberErr } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
      })

    if (memberErr) {
      console.error('[respond-invitation] Error adding member:', memberErr.message)
      throw createError({ statusCode: 500, message: 'Error joining workspace' })
    }

    // Assign project access for non-admin roles
    const isAdminPlus = ['admin', 'owner', 'superadmin'].includes(invite.role)
    const projectIds: string[] = invite.project_ids || []

    if (!isAdminPlus && projectIds.length > 0) {
      const rows = projectIds.map((pid: string) => ({
        project_id: pid,
        user_id: user.id,
        workspace_id: invite.workspace_id,
        granted_by: invite.invited_by,
      }))
      await supabase.from('project_members').upsert(rows, { onConflict: 'project_id,user_id' }).catch(() => {})
    }
  }

  // Mark accepted
  const { error: acceptErr } = await supabase
    .from('workspace_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  if (acceptErr) {
    console.error('[respond-invitation] Error marking accepted:', acceptErr.message)
  }

  return {
    ok: true,
    action: 'accepted',
    workspace_id: invite.workspace_id,
    workspace_slug: ws?.slug || '',
  }
})
