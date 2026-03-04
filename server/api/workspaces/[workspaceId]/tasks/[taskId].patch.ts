import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { taskAssignedEmailHtml } from '~~/server/utils/email'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceRole(event, workspaceId, 'member')

  const taskId = getRouterParam(event, 'taskId')
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to a project in this workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, project_id, column_id, assignees, projects!inner(workspace_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task || (task as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  const oldAssignees: string[] = (task as any).assignees || []

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.title_en !== undefined) updates.title_en = body.title_en
  if (body.description_en !== undefined) updates.description_en = body.description_en
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.assignees !== undefined) updates.assignees = body.assignees
  if (body.due_date !== undefined) updates.due_date = body.due_date
  if (body.estimated_hours !== undefined) updates.estimated_hours = body.estimated_hours
  if (body.tags !== undefined) updates.tags = body.tags
  if (body.position !== undefined) updates.position = body.position
  if (body.figma_links !== undefined) updates.figma_links = body.figma_links

  // Track old column for history
  const oldColumnId = (task as any).column_id as string | null

  if (body.column_id !== undefined) {
    updates.column_id = body.column_id
    updates.column_entered_at = new Date().toISOString()
    updates.last_activity_at = new Date().toISOString()
  }

  // Sprint assignment
  if (body.sprint_id !== undefined) {
    updates.sprint_id = body.sprint_id
  }

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('[tasks.patch] Supabase update error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error updating task' })
  }

  // Record column transition history (fire-and-forget)
  if (body.column_id !== undefined && body.column_id !== oldColumnId) {
    const now = new Date().toISOString()
    // Close previous column entry
    if (oldColumnId) {
      supabase
        .from('task_column_history')
        .update({ exited_at: now })
        .eq('task_id', taskId)
        .eq('column_id', oldColumnId)
        .is('exited_at', null)
        .then(() => {})
        .catch((err: any) => console.error('[tasks.patch] Error closing column history:', err))
    }
    // Open new column entry
    supabase
      .from('task_column_history')
      .insert({ task_id: taskId, column_id: body.column_id, entered_at: now })
      .then(() => {})
      .catch((err: any) => console.error('[tasks.patch] Error inserting column history:', err))
  }

  // Notify newly added assignees (fire-and-forget)
  if (body.assignees !== undefined) {
    const newAssignees: string[] = body.assignees || []
    const addedAssignees = newAssignees.filter(id => !oldAssignees.includes(id))

    if (addedAssignees.length > 0) {
      const taskTitle = updated.title || (task as any).title || 'Tarea'
      const { data: proj } = await supabase.from('projects').select('name').eq('id', updated.project_id).maybeSingle()
      const projectName = proj?.name || 'Proyecto'

      let assignerName = 'Alguien'
      try {
        const { data: profile } = await supabase.auth.admin.getUserById(user.id)
        assignerName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
      } catch {}

      for (const assigneeId of addedAssignees) {
        if (assigneeId === user.id) continue
        notifyUser({
          event,
          userId: assigneeId,
          type: 'task_assigned',
          title: `Tarea asignada: ${taskTitle}`,
          body: `${assignerName} te asignó "${taskTitle}" en ${projectName}`,
          entityType: 'task',
          entityId: updated.id,
          emailSubject: `Tarea asignada: ${taskTitle}`,
          emailHtml: taskAssignedEmailHtml(taskTitle, projectName, assignerName),
        }).catch(() => {})
      }
    }
  }

  return updated
})
