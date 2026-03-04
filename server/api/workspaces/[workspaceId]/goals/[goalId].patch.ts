import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const goalId = getRouterParam(event, 'goalId')!
  await requirePermission(event, workspaceId, 'manage_goals')

  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields provided to update' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify goal belongs to this workspace
  const { data: goal, error: fetchErr } = await supabase
    .from('goals')
    .select('id, current_value, target_value, status')
    .eq('id', goalId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchErr || !goal) throw createError({ statusCode: 404, message: 'Goal not found in this workspace' })

  const patch: Record<string, unknown> = {}

  if (body.title !== undefined) patch.title = body.title.trim()
  if (body.title_en !== undefined) patch.title_en = body.title_en?.trim() || null
  if (body.description !== undefined) patch.description = body.description?.trim() || null
  if (body.description_en !== undefined) patch.description_en = body.description_en?.trim() || null
  if (body.goal_type !== undefined) patch.goal_type = body.goal_type
  if (body.target_value !== undefined) patch.target_value = body.target_value
  if (body.unit !== undefined) patch.unit = body.unit?.trim() || null
  if (body.period_start !== undefined) patch.period_start = body.period_start || null
  if (body.period_end !== undefined) patch.period_end = body.period_end || null
  if (body.parent_goal_id !== undefined) patch.parent_goal_id = body.parent_goal_id || null
  if (body.owner_id !== undefined) patch.owner_id = body.owner_id || null

  // Handle current_value update with auto-complete logic
  if (body.current_value !== undefined) {
    patch.current_value = body.current_value

    // Auto-complete when current_value meets or exceeds target_value
    const newCurrentValue = Number(body.current_value)
    const effectiveTargetValue = body.target_value !== undefined
      ? Number(body.target_value)
      : Number(goal.target_value)

    if (
      !isNaN(newCurrentValue) &&
      !isNaN(effectiveTargetValue) &&
      effectiveTargetValue > 0 &&
      newCurrentValue >= effectiveTargetValue &&
      goal.status !== 'completed'
    ) {
      patch.status = 'completed'
    }
  }

  // Allow explicit status override (except when auto-completed above)
  if (body.status !== undefined && !patch.status) {
    patch.status = body.status
  }

  const { data, error } = await supabase
    .from('goals')
    .update(patch)
    .eq('id', goalId)
    .select()
    .single()

  if (error) {
    console.error('[goals.patch] update error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error updating goal' })
  }

  return data
})
