import { serverSupabaseServiceRole } from '#supabase/server'
import { translateTasksBatch } from '~~/server/utils/translate'

/**
 * Batch-translate tasks missing translations.
 * Uses batched API calls (10 tasks per LLM call) for token efficiency.
 *
 * Body: { limit?: number } — max tasks per request (default 20)
 * Response: { translated: number, remaining: number }
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event).catch(() => ({}))
  const limit = Math.min(body?.limit || 20, 50)
  const scanLimit = Math.min(Math.max(limit * 10, limit), 500)

  const supabase = serverSupabaseServiceRole(event)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, description, title_en, description_en, translations, projects!inner(workspace_id, kanban_template)')
    .eq('projects.workspace_id', workspaceId)
    .in('projects.kanban_template', ['dev', 'devops', 'backend_senior_dev', 'frontend_design', 'app_development'])
    .not('title', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(scanLimit)

  if (error) {
    throw createError({ statusCode: 500, message: 'Error fetching tasks' })
  }

  const needsTranslation = (tasks || []).filter(t => {
    const ur = (t.translations as any)?.ur || {}
    return !t.title_en || !ur.title || (t.description && (!t.description_en || !ur.description))
  }).slice(0, limit)

  if (!needsTranslation.length) {
    return { translated: 0, remaining: 0 }
  }

  // Batch in groups of 10 tasks per LLM call
  const BATCH_SIZE = 10
  let translated = 0

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE)
    const count = await translateTasksBatch({
      supabase,
      tasks: batch.map(t => ({ id: t.id, title: t.title, description: t.description })),
    })
    translated += count
  }

  return { translated, remaining: Math.max(needsTranslation.length - translated, 0) }
})
