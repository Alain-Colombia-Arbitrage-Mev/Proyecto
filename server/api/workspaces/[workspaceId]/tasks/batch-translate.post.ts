import { serverSupabaseServiceRole } from '#supabase/server'
import { translateTaskToAll } from '~~/server/utils/translate'

/**
 * Batch-translate all tasks in a workspace that are missing translations.
 * Catches tasks missing title_en OR having a description but no description_en.
 * Processes in small batches to avoid overwhelming the API.
 *
 * Body: { limit?: number } — max tasks to translate per call (default 20)
 * Response: { translated: number, remaining: number }
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event).catch(() => ({}))
  const limit = Math.min(body?.limit || 20, 50)

  const supabase = serverSupabaseServiceRole(event)

  // Get tasks that need translation:
  // - missing title_en (never translated)
  // - OR have a description but missing description_en
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, description, title_en, description_en, translations, projects!inner(workspace_id)')
    .eq('projects.workspace_id', workspaceId)
    .or('title_en.is.null,title_en.eq.,description_en.is.null')
    .not('title', 'is', null)
    .limit(limit)

  if (error) {
    throw createError({ statusCode: 500, message: 'Error fetching tasks' })
  }

  // Further filter: only tasks that actually need translation
  const needsTranslation = (tasks || []).filter(t => {
    const missingTitleEn = !t.title_en
    const hasDescButNoEn = t.description && !t.description_en
    const hasDescButNoUr = t.description && !(t.translations as any)?.ur?.description
    return missingTitleEn || hasDescButNoEn || hasDescButNoUr
  })

  if (!needsTranslation.length) {
    return { translated: 0, remaining: 0 }
  }

  // Translate each task (with small delay between calls to avoid rate limits)
  let translated = 0
  for (const task of needsTranslation) {
    try {
      await translateTaskToAll({
        supabase,
        taskId: task.id,
        title: task.title,
        description: task.description,
        sourceLang: 'es',
      })
      translated++
    } catch (err: any) {
      console.error(`[batch-translate] Failed task ${task.id}:`, err.message)
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  // Count remaining untranslated (approximate — checks title_en)
  const { count } = await supabase
    .from('tasks')
    .select('id, projects!inner(workspace_id)', { count: 'exact', head: true })
    .eq('projects.workspace_id', workspaceId)
    .or('title_en.is.null,title_en.eq.,description_en.is.null')

  return { translated, remaining: Math.max((count || 0) - translated, 0) }
})
