import { serverSupabaseServiceRole } from '#supabase/server'
import { requirePermission } from '~~/server/utils/permissions'
import { notifyUser } from '~~/server/utils/notifications'
import { taskAssignedEmailHtml } from '~~/server/utils/email'
import { translateTaskToEnglish } from '~~/server/utils/translate'
import { storeMemory } from '~~/server/utils/embeddings'

const MAX_DEPTH = 3

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!

  // Subtask creation requires the same permission as creating a regular task.
  const { user } = await requirePermission(event, workspaceId, 'create_tasks')

  const body = await readBody(event)
  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, message: 'title is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // ------------------------------------------------------------------
  // 1. Fetch and validate the parent task
  // ------------------------------------------------------------------
  // The !inner join on projects guarantees the task belongs to this workspace.
  // We select depth and ancestry so we can derive the child's values.
  const { data: parent, error: parentErr } = await supabase
    .from('tasks')
    .select('id, project_id, column_id, depth, ancestry, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (parentErr) {
    console.error('[subtasks.post] parent task lookup error:', parentErr.message, parentErr.details, parentErr.hint)
    throw createError({ statusCode: 500, message: 'Error fetching parent task' })
  }
  if (!parent) throw createError({ statusCode: 404, message: 'Parent task not found' })

  // ------------------------------------------------------------------
  // 2. Enforce max depth
  // ------------------------------------------------------------------
  // depth is 0-indexed: root tasks have depth 0. Max depth 3 means we
  // allow root (0) → level-1 (1) → level-2 (2) → level-3 (3).
  // A subtask of a depth-3 task would be depth-4 which is forbidden.
  const parentDepth: number = parent.depth ?? 0
  if (parentDepth >= MAX_DEPTH) {
    throw createError({
      statusCode: 422,
      message: `Maximum subtask depth of ${MAX_DEPTH} reached. Cannot nest further.`,
    })
  }

  const childDepth = parentDepth + 1

  // ancestry is an ordered array of ancestor IDs from root to immediate parent.
  // e.g. root.ancestry = []  →  child.ancestry = [rootId]
  //      child.ancestry = [rootId]  →  grandchild.ancestry = [rootId, childId]
  const parentAncestry: string[] = Array.isArray(parent.ancestry) ? parent.ancestry : []
  const childAncestry = [...parentAncestry, taskId]

  // ------------------------------------------------------------------
  // 3. Calculate position (append after existing siblings)
  // ------------------------------------------------------------------
  let position = 0
  const { data: maxPos } = await supabase
    .from('tasks')
    .select('position')
    .eq('parent_task_id', taskId)
    .order('position', { ascending: false })
    .limit(1)
  if (maxPos && maxPos.length > 0) {
    position = maxPos[0].position + 1
  }

  // ------------------------------------------------------------------
  // 4. Build insert payload
  // ------------------------------------------------------------------
  // project_id and column_id are inherited from the parent so the subtask
  // stays on the same board/column — callers cannot override these.
  const insertPayload: Record<string, unknown> = {
    parent_task_id: taskId,
    project_id: parent.project_id,
    column_id: parent.column_id || null,
    depth: childDepth,
    ancestry: childAncestry,
    title: body.title.trim(),
    description: body.description || null,
    priority: body.priority || 'medium',
    assignees: body.assignees || [],
    reporter_id: user.id,
    due_date: body.due_date || null,
    tags: body.tags || [],
    position,
  }

  // Bilingual fields — conditional to tolerate databases where the
  // bilingual migration has not yet been applied.
  if (body.title_en !== undefined) insertPayload.title_en = body.title_en
  if (body.description_en !== undefined) insertPayload.description_en = body.description_en

  // ------------------------------------------------------------------
  // 5. Insert
  // ------------------------------------------------------------------
  const { data: subtask, error: insertErr } = await supabase
    .from('tasks')
    .insert(insertPayload)
    .select()
    .single()

  if (insertErr) {
    console.error('[subtasks.post] insert error:', insertErr.message, insertErr.details, insertErr.hint)
    throw createError({ statusCode: 500, message: 'Error creating subtask' })
  }

  // ------------------------------------------------------------------
  // 6. Side-effects (fire-and-forget)
  // ------------------------------------------------------------------

  // Notify assignees
  const assignees: string[] = subtask.assignees || []
  if (assignees.length > 0) {
    const { data: proj } = await supabase
      .from('projects')
      .select('name')
      .eq('id', subtask.project_id)
      .maybeSingle()
    const projectName = proj?.name || 'Proyecto'

    let assignerName = 'Alguien'
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(user.id)
      assignerName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
    } catch {}

    for (const assigneeId of assignees) {
      if (assigneeId === user.id) continue
      notifyUser({
        event,
        userId: assigneeId,
        type: 'task_assigned',
        title: `Subtarea asignada: ${subtask.title}`,
        body: `${assignerName} te asignó "${subtask.title}" en ${projectName}`,
        entityType: 'task',
        entityId: subtask.id,
        emailSubject: `Subtarea asignada: ${subtask.title}`,
        emailHtml: taskAssignedEmailHtml(subtask.title, projectName, assignerName),
      }).catch(() => {})
    }
  }

  // Auto-translate if no English title was provided
  if (!subtask.title_en && subtask.title) {
    translateTaskToEnglish({
      supabase,
      taskId: subtask.id,
      title: subtask.title,
      description: subtask.description || null,
    }).catch(() => {})
  }

  // Store in agent memory
  storeMemory({
    supabase,
    workspaceId,
    contentText: `Subtarea creada: "${subtask.title}"${subtask.description ? `. ${subtask.description}` : ''}. Prioridad: ${subtask.priority}. Profundidad: ${childDepth}. Padre: ${taskId}.`,
    agentType: 'task',
    contentType: 'task',
    projectId: subtask.project_id,
    metadata: { taskId: subtask.id, parentTaskId: taskId },
    createdBy: user.id,
  }).catch(() => {})

  return subtask
})
