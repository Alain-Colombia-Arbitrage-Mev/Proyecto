import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_PER_PAGE = 50

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const query = getQuery(event)
  const projectId = query.project_id as string | undefined
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(query.limit as string) || 20))
  const offset = (page - 1) * limit

  const supabase = serverSupabaseServiceRole(event)

  let q = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (projectId) {
    q = q.eq('project_id', projectId)
  }

  const { data, error, count } = await q

  if (error) throw createError({ statusCode: 500, message: 'Error fetching documents' })
  return { data: data || [], total: count || 0, page, limit }
})
