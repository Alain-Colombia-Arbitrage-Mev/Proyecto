import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const columnId = getRouterParam(event, 'columnId')
  const body = await readBody(event)
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

  const updates: Record<string, any> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.color !== undefined) updates.color = body.color
  if (body.position !== undefined) updates.position = body.position
  if (body.wip_limit !== undefined) updates.wip_limit = body.wip_limit

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  const { data: updated, error } = await supabase
    .from('kanban_columns')
    .update(updates)
    .eq('id', columnId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error updating column' })
  return updated
})
