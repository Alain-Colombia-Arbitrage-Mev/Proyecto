import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!

  const { user } = await requirePermission(event, workspaceId, 'edit_tasks')

  const body = await readBody(event)
  const { title, title_en, target_date, position } = body ?? {}

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'El título del milestone es requerido' })
  }

  if (title.trim().length > 255) {
    throw createError({ statusCode: 400, message: 'El título no puede superar los 255 caracteres' })
  }

  if (target_date !== undefined && target_date !== null) {
    const parsed = Date.parse(target_date)
    if (isNaN(parsed)) {
      throw createError({ statusCode: 400, message: 'target_date debe ser una fecha válida (YYYY-MM-DD)' })
    }
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Proyecto no encontrado' })

  // Resolve position: append after existing milestones if not provided
  let resolvedPosition = 0
  if (position !== undefined && typeof position === 'number') {
    resolvedPosition = position
  } else {
    const { data: maxPos } = await supabase
      .from('project_milestones')
      .select('position')
      .eq('project_id', projectId)
      .order('position', { ascending: false })
      .limit(1)

    if (maxPos && maxPos.length > 0) {
      resolvedPosition = maxPos[0].position + 1
    }
  }

  const payload: Record<string, unknown> = {
    project_id: projectId,
    title: title.trim(),
    position: resolvedPosition,
    created_by: user.id,
  }

  if (title_en !== undefined) payload.title_en = title_en
  if (target_date !== undefined) payload.target_date = target_date || null

  const { data, error } = await supabase
    .from('project_milestones')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[milestones.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al crear el milestone' })
  }

  return data
})
