import { serverSupabaseServiceRole } from '#supabase/server'

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

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
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
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error creating task' })

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
