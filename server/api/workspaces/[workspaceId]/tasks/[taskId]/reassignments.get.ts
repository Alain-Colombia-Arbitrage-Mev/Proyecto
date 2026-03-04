import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!

  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (!task) throw createError({ statusCode: 404, message: 'Tarea no encontrada' })

  const { data, error } = await supabase
    .from('task_reassignments')
    .select('*')
    .eq('task_id', taskId)
    .order('reassigned_at', { ascending: false })

  if (error) {
    console.error('[reassignments.get] error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al obtener el historial de reasignaciones' })
  }

  return data || []
})
