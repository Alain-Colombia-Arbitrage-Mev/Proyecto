import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  const sprintId = getRouterParam(event, 'sprintId')!
  await requirePermission(event, workspaceId, 'manage_sprints')

  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields provided to update' })
  }

  if (body.start_date && body.end_date && new Date(body.end_date) <= new Date(body.start_date)) {
    throw createError({ statusCode: 400, message: 'end_date must be after start_date' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify sprint exists and belongs to this project/workspace
  const { data: sprint } = await supabase
    .from('sprints')
    .select('id, status, project_id')
    .eq('id', sprintId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!sprint) throw createError({ statusCode: 404, message: 'Sprint not found in this project' })

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  // When activating this sprint, complete any currently active sprint first
  if (body.status === 'active' && sprint.status !== 'active') {
    const { error: completeErr } = await supabase
      .from('sprints')
      .update({ status: 'completed' })
      .eq('project_id', projectId)
      .eq('status', 'active')
      .neq('id', sprintId)

    if (completeErr) {
      console.error('[sprints.patch] error completing active sprint:', completeErr.message)
      throw createError({ statusCode: 500, message: 'Error deactivating current active sprint' })
    }
  }

  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) patch.name = body.name.trim()
  if (body.goal !== undefined) patch.goal = body.goal?.trim() || null
  if (body.start_date !== undefined) patch.start_date = body.start_date
  if (body.end_date !== undefined) patch.end_date = body.end_date
  if (body.status !== undefined) patch.status = body.status

  const { data, error } = await supabase
    .from('sprints')
    .update(patch)
    .eq('id', sprintId)
    .select()
    .single()

  if (error) {
    console.error('[sprints.patch] update error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error updating sprint' })
  }

  return data
})
