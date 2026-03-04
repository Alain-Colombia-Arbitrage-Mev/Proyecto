import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  const sprintId = getRouterParam(event, 'sprintId')!
  await requirePermission(event, workspaceId, 'manage_sprints')

  const supabase = serverSupabaseServiceRole(event)

  // Verify sprint exists and belongs to this project
  const { data: sprint } = await supabase
    .from('sprints')
    .select('id, project_id')
    .eq('id', sprintId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!sprint) throw createError({ statusCode: 404, message: 'Sprint not found in this project' })

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  // Nullify sprint_id on all tasks assigned to this sprint
  const { error: nullifyErr } = await supabase
    .from('tasks')
    .update({ sprint_id: null })
    .eq('sprint_id', sprintId)

  if (nullifyErr) {
    console.error('[sprints.delete] error nullifying tasks:', nullifyErr.message, nullifyErr.details)
    throw createError({ statusCode: 500, message: 'Error unlinking tasks from sprint' })
  }

  // Delete the sprint
  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('id', sprintId)

  if (error) {
    console.error('[sprints.delete] delete error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error deleting sprint' })
  }

  return { success: true }
})
