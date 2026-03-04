import { serverSupabaseServiceRole } from '#supabase/server'

const ADMIN_ROLES = new Set(['admin', 'owner', 'superadmin'])

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  const commentId = getRouterParam(event, 'commentId')!

  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

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

  // Fetch the comment — must belong to the task
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

  if (!isAuthor && !isAdmin) {
    throw createError({ statusCode: 403, message: 'Solo el autor o un administrador pueden eliminar este comentario' })
  }

  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('[comments.delete] delete error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al eliminar el comentario' })
  }

  return { success: true }
})
