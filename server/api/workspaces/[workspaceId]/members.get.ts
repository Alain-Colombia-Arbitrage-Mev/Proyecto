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

  return members.map(m => ({
    ...m,
    email: emailMap[m.user_id] || null,
  }))
})
