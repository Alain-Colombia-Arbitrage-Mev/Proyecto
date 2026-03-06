import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { workspaceInvitationEmailHtml, pendingInvitationEmailHtml, sendEmail } from '~~/server/utils/email'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  if (!body.email || typeof body.email !== 'string') throw createError({ statusCode: 400, message: 'Email is required' })

  const normalizedEmail = body.email.trim().toLowerCase()
  const assignedRole = body.role || 'viewer'

  // Find user by email — paginate to handle large user bases
  let targetUser: any = null
  let page = 1
  const perPage = 500
  while (!targetUser) {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })
    if (authErr) throw createError({ statusCode: 500, message: 'Error searching users' })

    const users = authData?.users || []
    targetUser = users.find((u: any) => u.email?.toLowerCase() === normalizedEmail)

    if (targetUser || users.length < perPage) break
    page++
    if (page > 20) break // Safety limit
  }

  // Get workspace info and inviter name (needed for both paths)
  const { data: ws } = await supabase.from('workspaces').select('name, slug').eq('id', workspaceId).maybeSingle()
  const workspaceName = ws?.name || 'Workspace'

  let inviterName = 'Alguien'
  try {
    const { data: profile } = await supabase.auth.admin.getUserById(user.id)
    inviterName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
  } catch {}

  // ── User NOT found — send pending invitation ──
  if (!targetUser) {
    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('workspace_invitations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      throw createError({ statusCode: 409, message: 'Ya existe una invitación pendiente para este email' })
    }

    // Store the pending invitation
    const { data: invitation, error: invErr } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        email: normalizedEmail,
        role: assignedRole,
        invited_by: user.id,
        status: 'pending',
        project_ids: body.project_ids || [],
      })
      .select()
      .single()

    if (invErr) {
      console.error('[members.post] Error creating invitation:', invErr.message)
      throw createError({ statusCode: 500, message: 'Error creating invitation' })
    }

    // Build registration URL with invitation context
    const config = useRuntimeConfig()
    const baseUrl = config.appUrl || config.public?.appUrl || 'https://focus.nexaru.net'
    const registerUrl = `${baseUrl}/auth/register?invite=${invitation.id}&email=${encodeURIComponent(normalizedEmail)}`

    // Send invitation email
    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: `${inviterName} te invitó a ${workspaceName} en FocusFlow`,
      html: pendingInvitationEmailHtml({
        workspaceName,
        invitedByName: inviterName,
        role: assignedRole,
        registerUrl,
      }),
    }).catch((err) => {
      console.error('[members.post] Email send error:', err)
      return false
    })
    console.log(`[members.post] Invitation email to ${normalizedEmail}: ${emailSent ? 'SENT' : 'FAILED'}`)
    console.log(`[members.post] registerUrl: ${registerUrl}`)

    return {
      pending: true,
      email: normalizedEmail,
      role: assignedRole,
      message: `Invitación enviada a ${normalizedEmail}. Se unirá automáticamente al registrarse.`,
    }
  }

  // ── User found — add directly ──

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUser.id)
    .maybeSingle()

  if (existing) {
    // Clean up any leftover pending invitation for this email
    await supabase
      .from('workspace_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
    throw createError({ statusCode: 409, message: 'Este usuario ya es miembro del workspace' })
  }

  const { data: member, error } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: targetUser.id,
      role: assignedRole,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error adding member' })

  // For member/viewer roles: assign specific project access
  const isAdminPlus = ['admin', 'owner', 'superadmin'].includes(assignedRole)
  const projectIds: string[] = body.project_ids || []

  if (!isAdminPlus && projectIds.length > 0) {
    const rows = projectIds.map(pid => ({
      project_id: pid,
      user_id: targetUser.id,
      workspace_id: workspaceId,
      granted_by: user.id,
    }))
    await supabase.from('project_members').insert(rows)
  }

  // Notify the invited user (fire-and-forget)
  notifyUser({
    event,
    userId: targetUser.id,
    type: 'workspace_invitation',
    title: `Invitación a ${workspaceName}`,
    body: `${inviterName} te invitó a "${workspaceName}" como ${assignedRole}`,
    entityType: 'workspace',
    entityId: workspaceId,
    emailSubject: `Invitación a workspace: ${workspaceName}`,
    emailHtml: workspaceInvitationEmailHtml(workspaceName, inviterName, assignedRole),
  }).catch(() => {})

  return { ...member, email: targetUser.email, project_ids: isAdminPlus ? null : projectIds }
})
