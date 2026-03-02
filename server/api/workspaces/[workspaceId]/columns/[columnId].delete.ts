import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const columnId = getRouterParam(event, 'columnId')
  const supabase = serverSupabaseServiceRole(event)

  // Verify column belongs to a project in this workspace
  const { data: column } = await supabase
    .from('kanban_columns')
    .select('id, project_id, projects!inner(workspace_id)')
    .eq('id', columnId)
    .maybeSingle()

  if (!column || (column as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Column not found in this workspace' })
  }

  // Check if column has tasks
  const { count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('column_id', columnId)

  if (count && count > 0) {
    throw createError({ statusCode: 400, message: `No puedes eliminar una columna con ${count} tarea(s). Mueve las tareas primero.` })
  }

  const { error } = await supabase
    .from('kanban_columns')
    .delete()
    .eq('id', columnId)

  if (error) throw createError({ statusCode: 500, message: 'Error deleting column' })
  return { success: true }
})
