import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!

  const { user } = await requireWorkspaceMember(event, workspaceId)

  const query = getQuery(event)

  const supabase = serverSupabaseServiceRole(event)

  // Base query: action items assigned to the current user in this workspace.
  // Join through tasks → projects to scope to the workspace, and pull task title.
  let dbQuery = supabase
    .from('task_comments')
    .select(`
      *,
      tasks!inner (
        id,
        title,
        projects!inner (
          id,
          workspace_id
        )
      )
    `)
    .eq('assignee_id', user.id)
    .eq('is_action_item', true)
    .eq('tasks.projects.workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  // Optional resolved filter — accept 'true' / 'false' as strings or booleans
  if (query.resolved !== undefined) {
    const resolvedBool = query.resolved === 'true' || query.resolved === true
    dbQuery = dbQuery.eq('resolved', resolvedBool)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('[action-items.get] query error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al obtener los action items' })
  }

  // Flatten the response: promote task_title to the comment object so consumers
  // don't need to navigate nested joins.
  const items = (data || []).map((comment: any) => {
    const { tasks, ...rest } = comment
    return {
      ...rest,
      task_title: tasks?.title ?? null,
      task_id: tasks?.id ?? rest.task_id,
    }
  })

  return items
})
