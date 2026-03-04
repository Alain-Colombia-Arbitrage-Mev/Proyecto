import { serverSupabaseServiceRole } from '#supabase/server'

const VALID_RELATIONSHIP_TYPES = ['blocks', 'relates_to', 'duplicates'] as const
type RelationshipType = typeof VALID_RELATIONSHIP_TYPES[number]

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!

  const { user } = await requirePermission(event, workspaceId, 'edit_tasks')

  const body = await readBody(event)
  const { target_task_id, relationship_type } = body ?? {}

  if (!target_task_id || typeof target_task_id !== 'string') {
    throw createError({ statusCode: 400, message: 'target_task_id es requerido' })
  }

  if (!relationship_type || !VALID_RELATIONSHIP_TYPES.includes(relationship_type as RelationshipType)) {
    throw createError({
      statusCode: 400,
      message: `relationship_type debe ser uno de: ${VALID_RELATIONSHIP_TYPES.join(', ')}`,
    })
  }

  if (target_task_id === taskId) {
    throw createError({ statusCode: 400, message: 'Una tarea no puede relacionarse consigo misma' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify source task belongs to this workspace
  const { data: sourceTask } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (!sourceTask) throw createError({ statusCode: 404, message: 'Tarea origen no encontrada' })

  // Verify target task also belongs to this workspace
  const { data: targetTask } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', target_task_id)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (!targetTask) throw createError({ statusCode: 404, message: 'Tarea destino no encontrada en este workspace' })

  // Check for duplicate in both directions to prevent mirrored duplicates
  const { data: existing } = await supabase
    .from('task_relationships')
    .select('id')
    .or(
      `and(source_task_id.eq.${taskId},target_task_id.eq.${target_task_id}),` +
      `and(source_task_id.eq.${target_task_id},target_task_id.eq.${taskId})`
    )
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Ya existe una relación entre estas tareas' })
  }

  const { data, error } = await supabase
    .from('task_relationships')
    .insert({
      source_task_id: taskId,
      target_task_id,
      relationship_type,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[relationships.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al crear la relación' })
  }

  return data
})
