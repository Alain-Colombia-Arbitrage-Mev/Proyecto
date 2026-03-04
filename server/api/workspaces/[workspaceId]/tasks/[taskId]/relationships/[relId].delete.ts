import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  const relId = getRouterParam(event, 'relId')!

  await requirePermission(event, workspaceId, 'edit_tasks')

  const supabase = serverSupabaseServiceRole(event)

  // Verify the relationship belongs to this task (either direction) and workspace
  // First confirm the task is in this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (!task) throw createError({ statusCode: 404, message: 'Tarea no encontrada' })

  // Fetch the relationship and verify it involves this task
  const { data: relationship } = await supabase
    .from('task_relationships')
    .select('id, source_task_id, target_task_id')
    .eq('id', relId)
    .maybeSingle()

  if (!relationship) {
    throw createError({ statusCode: 404, message: 'Relación no encontrada' })
  }

  if (relationship.source_task_id !== taskId && relationship.target_task_id !== taskId) {
    throw createError({ statusCode: 403, message: 'Esta relación no pertenece a la tarea indicada' })
  }

  const { error } = await supabase
    .from('task_relationships')
    .delete()
    .eq('id', relId)

  if (error) {
    console.error('[relationships.delete] error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al eliminar la relación' })
  }

  return { success: true }
})
