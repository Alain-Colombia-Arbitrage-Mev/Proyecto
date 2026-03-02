import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = serverSupabaseServiceRole(event)

  const isSuperadmin = isPlatformAdmin(user.email)

  // Get workspace role if workspaceId query param provided
  const query = getQuery(event)
  let workspaceRole: string | null = null

  if (query.workspaceId) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', query.workspaceId as string)
      .eq('user_id', user.id)
      .maybeSingle()

    workspaceRole = membership?.role || null
  }

  // Effective role: superadmin overrides everything
  const effectiveRole = isSuperadmin ? 'superadmin' : (workspaceRole || 'member')

  return {
    id: user.id,
    email: user.email,
    is_platform_admin: isSuperadmin,
    workspace_role: workspaceRole,
    effective_role: effectiveRole,
  }
})
