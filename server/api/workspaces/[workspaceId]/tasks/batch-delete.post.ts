import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'delete_tasks')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  // Mode 1: Delete by column_id
  if (body.column_id) {
    // Verify column belongs to a project in this workspace
    const { data: col } = await supabase
      .from('kanban_columns')
      .select('id, project_id, projects!inner(workspace_id)')
      .eq('id', body.column_id)
      .maybeSingle()

    if (!col || (col as any).projects?.workspace_id !== workspaceId) {
      throw createError({ statusCode: 404, message: 'Column not found in this workspace' })
    }

    const { data: deleted, error } = await supabase
      .from('tasks')
      .delete()
      .eq('column_id', body.column_id)
      .select('id')

    if (error) throw createError({ statusCode: 500, message: 'Error deleting tasks' })
    return { success: true, deleted: deleted?.length || 0 }
  }

  // Mode 2: Delete by project_id (all tasks in project)
  if (body.project_id) {
    // Verify project belongs to this workspace
    const { data: proj } = await supabase
      .from('projects')
      .select('id, workspace_id')
      .eq('id', body.project_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!proj) {
      throw createError({ statusCode: 404, message: 'Project not found in this workspace' })
    }

    const { data: deleted, error } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', body.project_id)
      .select('id')

    if (error) throw createError({ statusCode: 500, message: 'Error deleting tasks' })
    return { success: true, deleted: deleted?.length || 0 }
  }

  // Mode 3: Delete by task IDs array
  if (body.task_ids && Array.isArray(body.task_ids) && body.task_ids.length > 0) {
    // Verify tasks belong to this workspace
    const { data: valid } = await supabase
      .from('tasks')
      .select('id, projects!inner(workspace_id)')
      .in('id', body.task_ids)
      .eq('projects.workspace_id', workspaceId)

    const validIds = (valid || []).map((t: any) => t.id)
    if (validIds.length === 0) {
      throw createError({ statusCode: 404, message: 'No valid tasks found' })
    }

    const { data: deleted, error } = await supabase
      .from('tasks')
      .delete()
      .in('id', validIds)
      .select('id')

    if (error) throw createError({ statusCode: 500, message: 'Error deleting tasks' })
    return { success: true, deleted: deleted?.length || 0 }
  }

  throw createError({ statusCode: 400, message: 'Provide column_id, project_id, or task_ids' })
})
