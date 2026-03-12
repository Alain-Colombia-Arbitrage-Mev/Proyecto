import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('workspace_members')
    .select('id, user_id, role, joined_at')
    .eq('workspace_id', workspaceId)
    .order('joined_at')

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Resolve emails from auth — fetch each member directly
  const members = data || []
  const emailMap: Record<string, string> = {}

  const emailResults = await Promise.allSettled(
    members.map(m =>
      supabase.auth.admin.getUserById(m.user_id).then(({ data: profile }) => {
        if (profile?.user?.email) emailMap[m.user_id] = profile.user.email
        else if (profile?.user?.user_metadata?.full_name) emailMap[m.user_id] = profile.user.user_metadata.full_name
      })
    )
  )

  // Fetch project_members for this workspace (table may not exist if migration 012 not applied)
  let pmByUser: Record<string, string[]> = {}
  try {
    const { data: pmData } = await supabase
      .from('project_members')
      .select('user_id, project_id')
      .eq('workspace_id', workspaceId)

    for (const pm of pmData || []) {
      if (!pmByUser[pm.user_id]) pmByUser[pm.user_id] = []
      pmByUser[pm.user_id]!.push(pm.project_id)
    }
  } catch {
    // project_members table may not exist yet
  }

  return members.map(m => {
    const isAdminPlus = ['admin', 'owner', 'superadmin'].includes(m.role)
    return {
      ...m,
      email: emailMap[m.user_id] || null,
      has_all_projects: isAdminPlus,
      project_ids: isAdminPlus ? [] : (pmByUser[m.user_id] || []),
    }
  })
})
