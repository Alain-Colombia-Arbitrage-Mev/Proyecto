import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  await requirePermission(event, workspaceId, 'manage_sprints')

  const body = await readBody(event)

  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })
  if (!body.start_date) throw createError({ statusCode: 400, message: 'start_date is required' })
  if (!body.end_date) throw createError({ statusCode: 400, message: 'end_date is required' })
  if (new Date(body.end_date) <= new Date(body.start_date)) {
    throw createError({ statusCode: 400, message: 'end_date must be after start_date' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  const requestedStatus = body.status || 'planned'

  // Only one sprint can be active at a time — reject if another is already active
  if (requestedStatus === 'active') {
    const { data: existingActive } = await supabase
      .from('sprints')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .limit(1)

    if (existingActive && existingActive.length > 0) {
      throw createError({
        statusCode: 409,
        message: 'A sprint is already active for this project. Complete it before starting a new one.',
      })
    }
  }

  const { data, error } = await supabase
    .from('sprints')
    .insert({
      project_id: projectId,
      name: body.name.trim(),
      goal: body.goal?.trim() || null,
      start_date: body.start_date,
      end_date: body.end_date,
      status: requestedStatus,
    })
    .select()
    .single()

  if (error) {
    console.error('[sprints.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error creating sprint' })
  }

  return data
})
