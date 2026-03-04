import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { taskAssignedEmailHtml } from '~~/server/utils/email'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  if (!body.title) throw createError({ statusCode: 400, message: 'Title is required' })

  const supabase = serverSupabaseServiceRole(event)

  // ------------------------------------------------------------------
  // Subtask path: when parent_task_id is provided, derive project/column
  // and depth/ancestry from the parent rather than requiring them in body.
  // ------------------------------------------------------------------
  let resolvedProjectId: string = body.project_id
  let resolvedColumnId: string | null = body.column_id || null
  let parentDepth = -1
  let parentAncestry: string[] = []

  if (body.parent_task_id) {
    // Fetch the parent and validate it belongs to this workspace
    const { data: parentTask, error: parentErr } = await supabase
      .from('tasks')
      .select('id, project_id, column_id, depth, ancestry, projects!inner(workspace_id)')
      .eq('id', body.parent_task_id)
      .eq('projects.workspace_id', workspaceId)
      .maybeSingle()

    if (parentErr) {
      console.error('[tasks.post] parent task lookup error:', parentErr.message, parentErr.details)
      throw createError({ statusCode: 500, message: 'Error fetching parent task' })
    }
    if (!parentTask) throw createError({ statusCode: 404, message: 'Parent task not found in this workspace' })

    const MAX_DEPTH = 3
    const pd: number = parentTask.depth ?? 0
    if (pd >= MAX_DEPTH) {
      throw createError({
        statusCode: 422,
        message: `Maximum subtask depth of ${MAX_DEPTH} reached. Cannot nest further.`,
      })
    }

    parentDepth = pd
    parentAncestry = Array.isArray(parentTask.ancestry) ? parentTask.ancestry : []
    // Inherit project and column from parent; caller cannot override
    resolvedProjectId = parentTask.project_id
    resolvedColumnId = parentTask.column_id || null
  } else {
    // Regular root-level task — project_id is mandatory
    if (!body.project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

    // Verify project belongs to this workspace
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.project_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })
  }

  // ------------------------------------------------------------------
  // Position: append after existing siblings in the same scope
  // ------------------------------------------------------------------
  let position = 0
  if (body.parent_task_id) {
    // Siblings share the same parent_task_id
    const { data: maxPos } = await supabase
      .from('tasks')
      .select('position')
      .eq('parent_task_id', body.parent_task_id)
      .order('position', { ascending: false })
      .limit(1)
    if (maxPos && maxPos.length > 0) position = maxPos[0].position + 1
  } else if (body.column_id) {
    // Root tasks are positioned within their column
    const { data: maxPos } = await supabase
      .from('tasks')
      .select('position')
      .eq('column_id', body.column_id)
      .order('position', { ascending: false })
      .limit(1)
    if (maxPos && maxPos.length > 0) position = maxPos[0].position + 1
  }

  // ------------------------------------------------------------------
  // Build insert payload
  // ------------------------------------------------------------------
  // figma_links only gets included when explicitly provided by the caller —
  // this keeps the endpoint compatible with databases where migration 014
  // (ADD COLUMN figma_links) has not yet been applied.
  const insertPayload: Record<string, unknown> = {
    project_id: resolvedProjectId,
    column_id: resolvedColumnId,
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

  // Subtask hierarchy fields — only set when creating a subtask
  if (body.parent_task_id) {
    insertPayload.parent_task_id = body.parent_task_id
    insertPayload.depth = parentDepth + 1
    insertPayload.ancestry = [...parentAncestry, body.parent_task_id]
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
