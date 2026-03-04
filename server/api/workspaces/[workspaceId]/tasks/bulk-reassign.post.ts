import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!

  const { user } = await requirePermission(event, workspaceId, 'manage_members')

  const body = await readBody(event)
  const { from_user_id, to_user_id, project_id, reason } = body ?? {}

  if (!from_user_id || typeof from_user_id !== 'string') {
    throw createError({ statusCode: 400, message: 'from_user_id es requerido' })
  }

  if (!to_user_id || typeof to_user_id !== 'string') {
    throw createError({ statusCode: 400, message: 'to_user_id es requerido' })
  }

  if (from_user_id === to_user_id) {
    throw createError({ statusCode: 400, message: 'from_user_id y to_user_id deben ser distintos' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify both users are members of this workspace
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .in('user_id', [from_user_id, to_user_id])

  const memberIds = (members || []).map(m => m.user_id)

  if (!memberIds.includes(from_user_id)) {
    throw createError({ statusCode: 404, message: 'El usuario origen no es miembro de este workspace' })
  }

  if (!memberIds.includes(to_user_id)) {
    throw createError({ statusCode: 404, message: 'El usuario destino no es miembro de este workspace' })
  }

  // Get all project IDs in this workspace (or just the specified project)
  let projectIds: string[]

  if (project_id) {
    if (typeof project_id !== 'string') {
      throw createError({ statusCode: 400, message: 'project_id debe ser un string' })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!project) throw createError({ statusCode: 404, message: 'Proyecto no encontrado en este workspace' })

    projectIds = [project_id]
  } else {
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('workspace_id', workspaceId)

    projectIds = (projects || []).map(p => p.id)
  }

  if (projectIds.length === 0) {
    return { count: 0 }
  }

  // Find all tasks assigned to from_user_id in the relevant projects
  // assignees is a UUID array column — use the contains operator
  const { data: tasksToReassign, error: fetchError } = await supabase
    .from('tasks')
    .select('id, assignees')
    .in('project_id', projectIds)
    .contains('assignees', [from_user_id])

  if (fetchError) {
    console.error('[bulk-reassign.post] fetch error:', fetchError.message, fetchError.details, fetchError.hint)
    throw createError({ statusCode: 500, message: 'Error al obtener las tareas' })
  }

  if (!tasksToReassign || tasksToReassign.length === 0) {
    return { count: 0 }
  }

  // Update each task's assignees array: swap from_user_id → to_user_id
  // Also record reassignment history per task
  let successCount = 0
  const reassignmentRecords: Record<string, unknown>[] = []
  const now = new Date().toISOString()

  for (const task of tasksToReassign) {
    const currentAssignees: string[] = Array.isArray(task.assignees) ? task.assignees : []

    // Build updated assignees: replace from_user_id with to_user_id
    // If to_user_id is already present, just remove from_user_id to avoid duplicates
    const updatedAssignees = currentAssignees.includes(to_user_id)
      ? currentAssignees.filter(id => id !== from_user_id)
      : currentAssignees.map(id => (id === from_user_id ? to_user_id : id))

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ assignees: updatedAssignees })
      .eq('id', task.id)

    if (updateError) {
      console.error('[bulk-reassign.post] update error on task', task.id, ':', updateError.message)
      // Continue processing remaining tasks rather than aborting the whole batch
      continue
    }

    successCount++

    reassignmentRecords.push({
      task_id: task.id,
      from_user_id,
      to_user_id,
      reassigned_by: user.id,
      reason: reason || null,
      reassigned_at: now,
    })
  }

  // Persist reassignment history records in bulk
  if (reassignmentRecords.length > 0) {
    const { error: historyError } = await supabase
      .from('task_reassignments')
      .insert(reassignmentRecords)

    if (historyError) {
      // Non-fatal: log but don't fail the response since tasks were already updated
      console.error('[bulk-reassign.post] history insert error:', historyError.message, historyError.details, historyError.hint)
    }
  }

  return { count: successCount }
})
