import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const projectId = getRouterParam(event, 'projectId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('[sprints.get] fetch error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error fetching sprints' })
  }

  return data || []
})
