import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  const milestoneId = getRouterParam(event, 'milestoneId')!

  await requirePermission(event, workspaceId, 'edit_tasks')

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Proyecto no encontrado' })

  // Verify milestone belongs to this project before deleting
  const { data: milestone } = await supabase
    .from('project_milestones')
    .select('id')
    .eq('id', milestoneId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (!milestone) throw createError({ statusCode: 404, message: 'Milestone no encontrado' })

  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', milestoneId)

  if (error) {
    console.error('[milestones.delete] error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error al eliminar el milestone' })
  }

  return { success: true }
})
