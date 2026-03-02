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

  // Resolve emails from auth — batch all user IDs
  const members = data || []
  const emailMap: Record<string, string> = {}

  // Paginate auth users to find emails for our members
  const memberIds = new Set(members.map(m => m.user_id))
  let page = 1
  const perPage = 500
  while (memberIds.size > Object.keys(emailMap).length) {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page, perPage })
    if (authErr) break
    const users = authData?.users || []
    for (const u of users) {
      if (memberIds.has(u.id)) {
        emailMap[u.id] = u.email || ''
      }
    }
    if (users.length < perPage) break
    page++
    if (page > 20) break
  }

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
