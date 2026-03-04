import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!

  const { user } = await requirePermission(event, workspaceId, 'manage_comments')

  const body = await readBody(event)
  const { content, assignee_id, mentions, is_action_item } = body ?? {}

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'El contenido del comentario es requerido' })
  }

  if (content.trim().length > 10000) {
    throw createError({ statusCode: 400, message: 'El comentario no puede superar los 10,000 caracteres' })
  }

  if (mentions !== undefined && !Array.isArray(mentions)) {
    throw createError({ statusCode: 400, message: 'mentions debe ser un array' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to this workspace via its project
  const { data: task } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (!task) {
    throw createError({ statusCode: 404, message: 'Tarea no encontrada' })
  }

  // Validate assignee is a workspace member when provided
  if (assignee_id) {
    const { data: assignee } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', assignee_id)
      .maybeSingle()

    if (!assignee) {
      throw createError({ statusCode: 400, message: 'El asignado no es miembro del workspace' })
    }
  }

  const payload: Record<string, unknown> = {
    task_id: taskId,
    user_id: user.id,
    content: content.trim(),
  }

  if (assignee_id !== undefined) payload.assignee_id = assignee_id
  if (mentions !== undefined) payload.mentions = mentions
  if (is_action_item !== undefined) payload.is_action_item = Boolean(is_action_item)

  const { data, error } = await supabase
    .from('task_comments')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('[comments.post] insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al crear el comentario' })
  }

  return data
})
