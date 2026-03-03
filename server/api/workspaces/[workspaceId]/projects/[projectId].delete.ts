import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const projectId = getRouterParam(event, 'projectId')!
  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id, workspace_id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found in this workspace' })
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw createError({ statusCode: 500, message: 'Error deleting project' })

  return { success: true }
})
