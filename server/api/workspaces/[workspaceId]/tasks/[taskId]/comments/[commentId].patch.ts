import { serverSupabaseServiceRole } from '#supabase/server'

const ADMIN_ROLES = new Set(['admin', 'owner', 'superadmin'])

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  const commentId = getRouterParam(event, 'commentId')!

  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const { content, resolved, is_action_item, assignee_id } = body ?? {}

  // At least one field must be present
  if (
    content === undefined &&
    resolved === undefined &&
    is_action_item === undefined &&
    assignee_id === undefined
  ) {
    throw createError({ statusCode: 400, message: 'No hay campos para actualizar' })
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw createError({ statusCode: 400, message: 'El contenido no puede estar vacío' })
    }
    if (content.trim().length > 10000) {
      throw createError({ statusCode: 400, message: 'El comentario no puede superar los 10,000 caracteres' })
    }
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (!task) {
    throw createError({ statusCode: 404, message: 'Tarea no encontrada' })
  }

  // Fetch the existing comment — must belong to the task
  const { data: comment } = await supabase
    .from('task_comments')
    .select('id, user_id, task_id')
    .eq('id', commentId)
    .eq('task_id', taskId)
    .maybeSingle()

  if (!comment) {
    throw createError({ statusCode: 404, message: 'Comentario no encontrado' })
  }

  const isAuthor = comment.user_id === user.id
  const isAdmin = ADMIN_ROLES.has(membership.role)

  // Editing content requires authorship or admin+
  if (content !== undefined && !isAuthor && !isAdmin) {
    throw createError({ statusCode: 403, message: 'Solo el autor o un administrador pueden editar el contenido' })
  }

  // Validate assignee when provided
  if (assignee_id !== undefined && assignee_id !== null) {
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

  const updates: Record<string, unknown> = {}

  if (content !== undefined) {
    updates.content = content.trim()
    updates.edited_at = new Date().toISOString()
  }

  // Any workspace member can toggle resolved / is_action_item / assignee_id
  if (resolved !== undefined) updates.resolved = Boolean(resolved)
  if (is_action_item !== undefined) updates.is_action_item = Boolean(is_action_item)
  if (assignee_id !== undefined) updates.assignee_id = assignee_id

  const { data, error } = await supabase
    .from('task_comments')
    .update(updates)
    .eq('id', commentId)
    .select('*')
    .single()

  if (error) {
    console.error('[comments.patch] update error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al actualizar el comentario' })
  }

  return data
})
