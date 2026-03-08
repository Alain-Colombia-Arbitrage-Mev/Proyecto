import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * GET /api/workspaces/:workspaceId/orchestrator/runs
 * Returns recent orchestrator runs for the workspace.
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('ai_orchestrator_runs')
    .select('id, prompt, agent_type, status, result, tasks_created, error, started_at, completed_at, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { data: data || [] }
})
