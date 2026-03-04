import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'view_agenda')

  const query = getQuery(event)
  const from = query.from as string
  const to = query.to as string

  if (!from || !to) {
    throw createError({ statusCode: 400, message: 'from and to query params are required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Fetch tasks with due dates in range
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, assignees, priority, project_id')
    .eq('workspace_id', workspaceId)
    .gte('due_date', from)
    .lte('due_date', to)
    .order('due_date')

  // Fetch meetings in range
  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, title, scheduled_at, duration_minutes, attendees, project_id')
    .eq('workspace_id', workspaceId)
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)
    .eq('status', 'scheduled')
    .order('scheduled_at')

  // Fetch reserved dates in range
  const { data: reservedDates } = await supabase
    .from('reserved_dates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('start_at', from)
    .lte('end_at', to)
    .order('start_at')

  return {
    tasks: tasks || [],
    meetings: meetings || [],
    reservedDates: reservedDates || [],
  }
})
