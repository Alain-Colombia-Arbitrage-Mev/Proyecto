import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requirePermission(event, workspaceId, 'manage_goals')

  const body = await readBody(event)

  if (!body?.title?.trim()) throw createError({ statusCode: 400, message: 'title is required' })
  if (!body.goal_type) throw createError({ statusCode: 400, message: 'goal_type is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Validate parent_goal_id if provided
  if (body.parent_goal_id) {
    const { data: parentGoal } = await supabase
      .from('goals')
      .select('id')
      .eq('id', body.parent_goal_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!parentGoal) {
      throw createError({ statusCode: 404, message: 'Parent goal not found in this workspace' })
    }
  }

  const payload: Record<string, unknown> = {
    workspace_id: workspaceId,
    title: body.title.trim(),
    goal_type: body.goal_type,
    status: body.status || 'active',
    owner_id: body.owner_id || user.id,
  }

  if (body.title_en !== undefined) payload.title_en = body.title_en?.trim() || null
  if (body.description !== undefined) payload.description = body.description?.trim() || null
  if (body.description_en !== undefined) payload.description_en = body.description_en?.trim() || null
  if (body.target_value !== undefined) payload.target_value = body.target_value
  if (body.current_value !== undefined) payload.current_value = body.current_value ?? 0
  if (body.unit !== undefined) payload.unit = body.unit?.trim() || null
  if (body.period_start !== undefined) payload.period_start = body.period_start || null
  if (body.period_end !== undefined) payload.period_end = body.period_end || null
  if (body.parent_goal_id !== undefined) payload.parent_goal_id = body.parent_goal_id || null

  const { data, error } = await supabase
    .from('goals')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[goals.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error creating goal' })
  }

  return data
})
