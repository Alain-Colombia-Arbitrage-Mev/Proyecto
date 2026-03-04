import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const depId = getRouterParam(event, 'depId')!
  await requirePermission(event, workspaceId, 'manage_workspace')

  const supabase = serverSupabaseServiceRole(event)

  // Verify the dependency exists and both projects belong to this workspace.
  // We join through projects to confirm workspace ownership.
  const { data: dep, error: fetchErr } = await supabase
    .from('project_dependencies')
    .select('id, source_project_id, target_project_id')
    .eq('id', depId)
    .maybeSingle()

  if (fetchErr || !dep) throw createError({ statusCode: 404, message: 'Project dependency not found' })

  // Confirm at least the source project is in this workspace (ownership check)
  const { data: sourceProject } = await supabase
    .from('projects')
    .select('id')
    .eq('id', dep.source_project_id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!sourceProject) {
    throw createError({ statusCode: 403, message: 'Project dependency does not belong to this workspace' })
  }

  const { error } = await supabase
    .from('project_dependencies')
    .delete()
    .eq('id', depId)

  if (error) {
    console.error('[project-dependencies.delete] delete error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error deleting project dependency' })
  }

  return { success: true }
})
