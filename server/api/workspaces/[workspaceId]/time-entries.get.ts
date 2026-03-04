import { serverSupabaseServiceRole } from '#supabase/server'
import { requirePermission } from '~~/server/utils/permissions'

const MAX_PER_PAGE = 200

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!

  // Requires view_timesheets (viewer+). Returns membership for role checks below.
  const { user, membership } = await requirePermission(event, workspaceId, 'view_timesheets')

  const query = getQuery(event)
  const page  = Math.max(1, parseInt(query.page  as string) || 1)
  const limit = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(query.limit as string) || 50))
  const offset = (page - 1) * limit

  const qProjectId  = query.project_id  as string | undefined
  const qTaskId     = query.task_id     as string | undefined
  const qStartDate  = query.start_date  as string | undefined
  const qEndDate    = query.end_date    as string | undefined

  // admin+ (manage_timesheets level = 2) may request any user's entries.
  // viewer/member/marketing default to their own entries.
  const canViewAll = ['admin', 'owner', 'superadmin'].includes(membership.role)
  let targetUserId: string | undefined

  if (query.user_id && canViewAll) {
    targetUserId = query.user_id as string
  } else if (!canViewAll) {
    // Non-admin users can only see their own entries regardless of query param
    targetUserId = user.id
  }
  // canViewAll + no user_id filter → all users in workspace

  const supabase = serverSupabaseServiceRole(event)

  let q = supabase
    .from('time_entries')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('start_time', { ascending: false })
    .range(offset, offset + limit - 1)

  if (targetUserId)  q = q.eq('user_id',    targetUserId)
  if (qProjectId)    q = q.eq('project_id', qProjectId)
  if (qTaskId)       q = q.eq('task_id',    qTaskId)
  if (qStartDate)    q = q.gte('start_time', qStartDate)
  if (qEndDate) {
    // Make end_date inclusive by advancing to end-of-day if it looks like a bare date (YYYY-MM-DD)
    const endBound = /^\d{4}-\d{2}-\d{2}$/.test(qEndDate)
      ? `${qEndDate}T23:59:59.999Z`
      : qEndDate
    q = q.lte('start_time', endBound)
  }

  const { data, error, count } = await q

  if (error) {
    console.error('[time-entries.get] query error:', error.message, error.details)
    throw createError({ statusCode: 500, message: 'Error fetching time entries' })
  }

  return { data: data ?? [], total: count ?? 0, page, limit }
})
