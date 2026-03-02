import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const body = await readBody(event)
  if (!body.project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (!body.title) throw createError({ statusCode: 400, message: 'title is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', body.project_id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  const { data: existing } = await supabase
    .from('kanban_columns')
    .select('position')
    .eq('project_id', body.project_id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { data: column, error } = await supabase
    .from('kanban_columns')
    .insert({
      project_id: body.project_id,
      title: body.title,
      color: body.color || '#6B7280',
      position: nextPosition,
      wip_limit: body.wip_limit || null,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error creating column' })
  return column
})
