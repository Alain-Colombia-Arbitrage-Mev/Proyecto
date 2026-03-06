import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const inviteId = body.inviteId as string

  if (!inviteId) throw createError({ statusCode: 400, message: 'Missing inviteId' })

  const supabase = serverSupabaseServiceRole(event)

  let userId: string | null = null
  let userEmail: string | null = null

  // Get the authenticated user — required
  try {
    const user = await serverSupabaseUser(event)
    if (user?.id && user?.email) {
      userId = user.id
      userEmail = user.email.toLowerCase()
    }
  } catch {}

  if (!userId || !userEmail) {
    // Not authenticated yet — will be processed by process-invitations later
    return { processed: false, reason: 'not_authenticated' }
  }

  // Load the invitation
  const { data: invite, error } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, project_ids, invited_by, status')
    .eq('id', inviteId)
    .maybeSingle()

  if (error || !invite) {
    return { processed: false, reason: 'invitation_not_found' }
  }

  if (invite.status !== 'pending') {
    return { processed: false, reason: 'already_processed' }
  }

  // Verify email matches
  if (invite.email.toLowerCase() !== userEmail) {
    throw createError({ statusCode: 403, message: 'Email does not match invitation' })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('workspace_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id)
    return { processed: true, alreadyMember: true, workspaceId: invite.workspace_id }
  }

  // Add as workspace member
  const { error: memberErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: invite.workspace_id,
      user_id: userId,
      role: invite.role,
    })

  if (memberErr) {
    console.error(`[accept-invitation] Error adding member:`, memberErr.message)
    throw createError({ statusCode: 500, message: 'Error adding member to workspace' })
  }

  // Assign project access for non-admin roles
  const isAdminPlus = ['admin', 'owner', 'superadmin'].includes(invite.role)
  const projectIds: string[] = invite.project_ids || []

  if (!isAdminPlus && projectIds.length > 0) {
    const rows = projectIds.map((pid: string) => ({
      project_id: pid,
      user_id: userId,
      workspace_id: invite.workspace_id,
      granted_by: invite.invited_by,
    }))
    await supabase.from('project_members').upsert(rows, { onConflict: 'project_id,user_id' }).catch((err: any) => {
      console.error('[accept-invitation] Error assigning projects:', err)
    })
  }

  // Mark invitation as accepted
  await supabase
    .from('workspace_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  console.log(`[accept-invitation] User ${userEmail} added to workspace ${invite.workspace_id} as ${invite.role} with ${projectIds.length} projects`)

  return {
    processed: true,
    workspaceId: invite.workspace_id,
    role: invite.role,
    projectIds: isAdminPlus ? [] : projectIds,
  }
})
