import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_PER_PAGE = 100

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  const query = getQuery(event)
  const projectId = query.project_id as string | undefined
  const columnId = query.column_id as string | undefined
  const priority = query.priority as string | undefined
  const assignee = query.assignee as string | undefined
  const search = query.search as string | undefined
  // parent_task_id: return only direct children of this task
  const parentTaskId = query.parent_task_id as string | undefined
  // top_level=true: return only root tasks (no parent). Ignored when parent_task_id is set.
  const topLevel = !parentTaskId && (query.top_level === 'true' || query.top_level === '1')
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(query.limit as string) || 50))
  const offset = (page - 1) * limit

  const supabase = serverSupabaseServiceRole(event)

  // Filter by project access for member/viewer
  const projectIds = await getUserProjectIds(event, workspaceId, user.id, membership.role)

  // We need to join tasks through projects that belong to this workspace
  let q = supabase
    .from('tasks')
    .select('*, projects!inner(workspace_id)', { count: 'exact' })
    .eq('projects.workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Restrict to accessible projects for member/viewer
  if (projectIds !== null) {
    q = q.in('project_id', projectIds.length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000'])
  }

  if (projectId) q = q.eq('project_id', projectId)
  if (columnId) q = q.eq('column_id', columnId)
  if (priority) q = q.eq('priority', priority)
  if (assignee) q = q.contains('assignees', [assignee])
  if (search) q = q.ilike('title', `%${search}%`)
  // Subtask hierarchy filters
  if (parentTaskId) {
    q = q.eq('parent_task_id', parentTaskId)
  } else if (topLevel) {
    q = q.is('parent_task_id', null)
  }

  const { data, error, count } = await q

  if (error) throw createError({ statusCode: 500, message: 'Error fetching tasks' })

  // Strip the joined projects object from response
  const tasks = (data || []).map(({ projects: _p, ...task }) => task)

  return { data: tasks, total: count || 0, page, limit }
})
