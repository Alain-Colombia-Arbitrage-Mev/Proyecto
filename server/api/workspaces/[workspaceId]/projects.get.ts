import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Filter by project access for member/viewer
  const projectIds = await getUserProjectIds(event, workspaceId, user.id, membership.role)

  let query = supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (projectIds !== null) {
    query = query.in('id', projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data, error } = await query

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data || []
})
