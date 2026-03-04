import { serverSupabaseServiceRole } from '#supabase/server'

const VALID_ENTITY_TYPES = ['project', 'task'] as const
type EntityType = typeof VALID_ENTITY_TYPES[number]

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const goalId = getRouterParam(event, 'goalId')!
  await requirePermission(event, workspaceId, 'manage_goals')

  const body = await readBody(event)

  if (!body?.entity_type) throw createError({ statusCode: 400, message: 'entity_type is required' })
  if (!body?.entity_id) throw createError({ statusCode: 400, message: 'entity_id is required' })

  if (!VALID_ENTITY_TYPES.includes(body.entity_type as EntityType)) {
    throw createError({
      statusCode: 400,
      message: `entity_type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify goal belongs to this workspace
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!goal) throw createError({ statusCode: 404, message: 'Goal not found in this workspace' })

  // Validate the entity exists within this workspace
  if (body.entity_type === 'project') {
    const { data: proj } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.entity_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!proj) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })
  } else if (body.entity_type === 'task') {
    const { data: task } = await supabase
      .from('tasks')
      .select('id, projects!inner(workspace_id)')
      .eq('id', body.entity_id)
      .eq('projects.workspace_id', workspaceId)
      .maybeSingle()

    if (!task) throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  // Prevent duplicate links
  const { data: existing } = await supabase
    .from('goal_links')
    .select('id')
    .eq('goal_id', goalId)
    .eq('entity_type', body.entity_type)
    .eq('entity_id', body.entity_id)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, message: 'This entity is already linked to the goal' })
  }

  const { data, error } = await supabase
    .from('goal_links')
    .insert({
      goal_id: goalId,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
    })
    .select()
    .single()

  if (error) {
    console.error('[goal-links.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error creating goal link' })
  }

  return data
})
