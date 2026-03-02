import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const projectId = getRouterParam(event, 'projectId')
  const supabase = serverSupabaseServiceRole(event)

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .single()
  if (projErr) throw createError({ statusCode: 404, message: 'Project not found' })

  const [{ data: columns }, { data: tasks }] = await Promise.all([
    supabase
      .from('kanban_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('position'),
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position'),
  ])

  return {
    project,
    columns: columns || [],
    tasks: tasks || [],
  }
})
