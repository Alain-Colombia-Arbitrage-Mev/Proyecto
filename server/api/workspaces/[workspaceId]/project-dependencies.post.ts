import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'manage_workspace')

  const body = await readBody(event)

  if (!body?.source_project_id) throw createError({ statusCode: 400, message: 'source_project_id is required' })
  if (!body?.target_project_id) throw createError({ statusCode: 400, message: 'target_project_id is required' })

  if (body.source_project_id === body.target_project_id) {
    throw createError({ statusCode: 400, message: 'A project cannot depend on itself' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify both projects exist in this workspace
  const { data: projectsFound, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)
    .in('id', [body.source_project_id, body.target_project_id])

  if (projErr) {
    console.error('[project-dependencies.post] projects fetch error:', projErr.message)
    throw createError({ statusCode: 500, message: 'Error validating projects' })
  }

  const foundIds = new Set((projectsFound || []).map(p => p.id))
  if (!foundIds.has(body.source_project_id)) {
    throw createError({ statusCode: 404, message: 'Source project not found in this workspace' })
  }
  if (!foundIds.has(body.target_project_id)) {
    throw createError({ statusCode: 404, message: 'Target project not found in this workspace' })
  }

  // Prevent duplicate dependencies
  const { data: existing } = await supabase
    .from('project_dependencies')
    .select('id')
    .eq('source_project_id', body.source_project_id)
    .eq('target_project_id', body.target_project_id)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, message: 'This dependency already exists' })
  }

  const { data, error } = await supabase
    .from('project_dependencies')
    .insert({
      source_project_id: body.source_project_id,
      target_project_id: body.target_project_id,
      dependency_type: body.dependency_type || 'finish_to_start',
    })
    .select()
    .single()

  if (error) {
    console.error('[project-dependencies.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error creating project dependency' })
  }

  return data
})
