import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.email) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const supabase = serverSupabaseServiceRole(event)
  const normalizedEmail = user.email.toLowerCase()

  // Find all pending invitations for this email
  const { data: invitations, error } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, role, project_ids, invited_by')
    .eq('email', normalizedEmail)
    .eq('status', 'pending')

  if (error || !invitations || invitations.length === 0) {
    return { processed: 0 }
  }

  let processed = 0

  for (const invite of invitations) {
    // Check if already a member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Already a member, mark invitation as accepted
      await supabase
        .from('workspace_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invite.id)
      continue
    }

    // Add as workspace member
    const { error: memberErr } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
      })

    if (memberErr) {
      console.error(`[process-invitations] Error adding member for invite ${invite.id}:`, memberErr.message)
      continue
    }

    // For non-admin roles: assign specific project access
    const isAdminPlus = ['admin', 'owner', 'superadmin'].includes(invite.role)
    const projectIds: string[] = invite.project_ids || []

    if (!isAdminPlus && projectIds.length > 0) {
      const rows = projectIds.map((pid: string) => ({
        project_id: pid,
        user_id: user.id,
        workspace_id: invite.workspace_id,
        granted_by: invite.invited_by,
      }))
      await supabase.from('project_members').insert(rows).catch(() => {})
    }

    // Mark invitation as accepted
    await supabase
      .from('workspace_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    processed++
  }

  return { processed, total: invitations.length }
})
