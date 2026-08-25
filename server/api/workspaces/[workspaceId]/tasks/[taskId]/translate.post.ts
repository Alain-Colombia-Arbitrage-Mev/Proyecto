import { serverSupabaseServiceRole } from '#supabase/server'
import { translateTaskToAll } from '~~/server/utils/translate'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const body = await readBody(event).catch(() => ({}))
  const supabase = serverSupabaseServiceRole(event)

  const { data: task, error } = await supabase
    .from('tasks')
    .select('id, title, description, project_id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .eq('projects.workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    console.error('[tasks.translate] task lookup error:', error.message, error.details)
    throw createError({ statusCode: 500, message: 'Error fetching task' })
  }
  if (!task) throw createError({ statusCode: 404, message: 'Task not found in this workspace' })

  const title = String(body?.title ?? task.title ?? '').trim()
  const description = body?.description !== undefined
    ? String(body.description || '')
    : (task.description || null)

  if (!title) {
    throw createError({ statusCode: 400, message: 'Task title is required for translation' })
  }

  const ok = await translateTaskToAll({
    supabase,
    taskId,
    title,
    description,
    sourceLang: 'auto',
  })

  if (!ok) {
    throw createError({ statusCode: 500, message: 'Translation failed' })
  }

  const { data: updated, error: updateFetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (updateFetchError) {
    console.error('[tasks.translate] updated task fetch error:', updateFetchError.message, updateFetchError.details)
    throw createError({ statusCode: 500, message: 'Task translated, but could not fetch updated task' })
  }

  return { ok: true, task: updated }
})
