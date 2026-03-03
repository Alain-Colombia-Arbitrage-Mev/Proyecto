import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { taskAssignedEmailHtml } from '~~/server/utils/email'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  if (!body.title) throw createError({ statusCode: 400, message: 'Title is required' })
  if (!body.project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', body.project_id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  // Get max position in column
  let position = 0
  if (body.column_id) {
    const { data: maxPos } = await supabase
      .from('tasks')
      .select('position')
      .eq('column_id', body.column_id)
      .order('position', { ascending: false })
      .limit(1)
    if (maxPos && maxPos.length > 0) position = maxPos[0].position + 1
  }

  // Build insert payload conditionally. figma_links only gets included when
  // explicitly provided by the caller — this keeps the endpoint compatible with
  // databases where migration 014 (ADD COLUMN figma_links) has not yet been applied.
  // If the column is missing and we unconditionally send the field, Postgres will
  // reject the insert with "column does not exist" which surfaces as a 500.
  const insertPayload: Record<string, unknown> = {
    project_id: body.project_id,
    column_id: body.column_id || null,
    title: body.title,
    description: body.description || null,
    priority: body.priority || 'medium',
    assignees: body.assignees || [],
    reporter_id: user.id,
    due_date: body.due_date || null,
    estimated_hours: body.estimated_hours || null,
    position,
    tags: body.tags || [],
  }

  // Bilingual fields (optional — migration 018 may not be applied yet)
  if (body.title_en !== undefined) insertPayload.title_en = body.title_en
  if (body.description_en !== undefined) insertPayload.description_en = body.description_en

  // Only include figma_links when the caller sends it (migration may not be applied yet)
  if (body.figma_links !== undefined) {
    insertPayload.figma_links = body.figma_links
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error('[tasks.post] Supabase insert error:', error.message, error.details, error.hint)
    throw createError({ statusCode: 500, message: 'Error creating task' })
  }

  // Notify assignees (fire-and-forget)
  const newAssignees: string[] = task.assignees || []
  if (newAssignees.length > 0) {
    const { data: proj } = await supabase.from('projects').select('name').eq('id', task.project_id).maybeSingle()
    const projectName = proj?.name || 'Proyecto'

    let assignerName = 'Alguien'
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(user.id)
      assignerName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
    } catch {}

    for (const assigneeId of newAssignees) {
      if (assigneeId === user.id) continue
      notifyUser({
        event,
        userId: assigneeId,
        type: 'task_assigned',
        title: `Tarea asignada: ${task.title}`,
        body: `${assignerName} te asignó "${task.title}" en ${projectName}`,
        entityType: 'task',
        entityId: task.id,
        emailSubject: `Tarea asignada: ${task.title}`,
        emailHtml: taskAssignedEmailHtml(task.title, projectName, assignerName),
      }).catch(() => {})
    }
  }

  // Auto-translate to English if no English title was provided (fire-and-forget)
  if (!task.title_en && task.title) {
    translateTaskToEnglish({
      supabase,
      taskId: task.id,
      title: task.title,
      description: task.description || null,
    }).catch(() => {})
  }

  // Auto-store task as memory for the task agent (fire-and-forget)
  storeMemory({
    supabase,
    workspaceId,
    contentText: `Tarea creada: "${task.title}"${task.description ? `. ${task.description}` : ''}. Prioridad: ${task.priority}. Tags: ${(task.tags || []).join(', ')}`,
    agentType: 'task',
    contentType: 'task',
    projectId: task.project_id,
    metadata: { taskId: task.id },
    createdBy: user.id,
  }).catch(() => {})

  return task
})
