import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  const milestoneId = getRouterParam(event, 'milestoneId')!

  await requirePermission(event, workspaceId, 'edit_tasks')

  const body = await readBody(event)
  const { title, title_en, target_date, completed, position } = body ?? {}

  // At least one field must be provided
  if (
    title === undefined &&
    title_en === undefined &&
    target_date === undefined &&
    completed === undefined &&
    position === undefined
  ) {
    throw createError({ statusCode: 400, message: 'Se debe proporcionar al menos un campo para actualizar' })
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw createError({ statusCode: 400, message: 'El título no puede estar vacío' })
    }
    if (title.trim().length > 255) {
      throw createError({ statusCode: 400, message: 'El título no puede superar los 255 caracteres' })
    }
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

  // Verify milestone belongs to this project
  const { data: existing } = await supabase
    .from('project_milestones')
    .select('id, completed, completed_at')
    .eq('id', milestoneId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!existing) throw createError({ statusCode: 404, message: 'Milestone no encontrado' })

  const patch: Record<string, unknown> = {}

  if (title !== undefined) patch.title = title.trim()
  if (title_en !== undefined) patch.title_en = title_en
  if (target_date !== undefined) patch.target_date = target_date || null
  if (position !== undefined && typeof position === 'number') patch.position = position

  if (completed !== undefined) {
    const isCompleting = Boolean(completed)
    patch.completed = isCompleting

    if (isCompleting && !existing.completed) {
      // Transitioning from incomplete → complete: stamp completed_at
      patch.completed_at = new Date().toISOString()
    } else if (!isCompleting) {
      // Re-opening a completed milestone: clear the timestamp
      patch.completed_at = null
    }
  }

  const { data, error } = await supabase
    .from('project_milestones')
    .update(patch)
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) {
    console.error('[milestones.patch] error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al actualizar el milestone' })
  }

  return data
})
