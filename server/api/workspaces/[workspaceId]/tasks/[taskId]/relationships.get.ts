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

  // Fetch relationships where this task is the source
  const { data: asSource, error: sourceError } = await supabase
    .from('task_relationships')
    .select(`
      id,
      relationship_type,
      created_at,
      target_task_id,
      target_task:tasks!task_relationships_target_task_id_fkey(id, title, title_en, project_id)
    `)
    .eq('source_task_id', taskId)

  if (sourceError) {
    console.error('[relationships.get] source query error:', sourceError.message, sourceError.details, sourceError.hint)
    throw createError({ statusCode: 500, message: 'Error al obtener relaciones (source)' })
  }

  // Fetch relationships where this task is the target
  const { data: asTarget, error: targetError } = await supabase
    .from('task_relationships')
    .select(`
      id,
      relationship_type,
      created_at,
      source_task_id,
      source_task:tasks!task_relationships_source_task_id_fkey(id, title, title_en, project_id)
    `)
    .eq('target_task_id', taskId)

  if (targetError) {
    console.error('[relationships.get] target query error:', targetError.message, targetError.details, targetError.hint)
    throw createError({ statusCode: 500, message: 'Error al obtener relaciones (target)' })
  }

  return {
    as_source: asSource || [],
    as_target: asTarget || [],
  }
})
