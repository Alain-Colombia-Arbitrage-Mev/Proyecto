import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user?.email) throw createError({ statusCode: 401, message: 'Not authenticated' })

  const supabase = serverSupabaseServiceRole(event)

  const { data: invitations, error } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, project_ids, invited_by, created_at, workspaces(name, slug)')
    .eq('email', user.email.toLowerCase())
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[pending-invitations] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error fetching invitations' })
  }

  // Enrich with inviter name
  const results = []
  for (const inv of invitations || []) {
    let inviterName = ''
    if (inv.invited_by) {
      try {
        const { data: profile } = await supabase.auth.admin.getUserById(inv.invited_by)
        inviterName = profile?.user?.user_metadata?.full_name || profile?.user?.email || ''
      } catch {}
    }

    results.push({
      id: inv.id,
      workspace_id: inv.workspace_id,
      workspace_name: (inv as any).workspaces?.name || '',
      workspace_slug: (inv as any).workspaces?.slug || '',
      role: inv.role,
      invited_by_name: inviterName,
      created_at: inv.created_at,
    })
  }

  return results
})
