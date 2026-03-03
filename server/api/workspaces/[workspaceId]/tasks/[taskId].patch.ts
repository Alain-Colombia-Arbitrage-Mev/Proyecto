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
    .select('id, title, project_id, assignees, projects!inner(workspace_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task || (task as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  const oldAssignees: string[] = (task as any).assignees || []

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.assignees !== undefined) updates.assignees = body.assignees
  if (body.due_date !== undefined) updates.due_date = body.due_date
  if (body.estimated_hours !== undefined) updates.estimated_hours = body.estimated_hours
  if (body.tags !== undefined) updates.tags = body.tags
  if (body.position !== undefined) updates.position = body.position
  if (body.figma_links !== undefined) updates.figma_links = body.figma_links

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

  if (error) {
    console.error('[tasks.patch] Supabase update error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error updating task' })
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
