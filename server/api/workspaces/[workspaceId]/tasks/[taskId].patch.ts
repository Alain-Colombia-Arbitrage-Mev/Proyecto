import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const taskId = getRouterParam(event, 'taskId')
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to a project in this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, project_id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task || (task as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.assignees !== undefined) updates.assignees = body.assignees
  if (body.due_date !== undefined) updates.due_date = body.due_date
  if (body.estimated_hours !== undefined) updates.estimated_hours = body.estimated_hours
  if (body.tags !== undefined) updates.tags = body.tags
  if (body.position !== undefined) updates.position = body.position

  if (body.column_id !== undefined) {
    updates.column_id = body.column_id
    updates.column_entered_at = new Date().toISOString()
    updates.last_activity_at = new Date().toISOString()
  }

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error updating task' })
  return updated
})
