import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'use_workflows')

  const supabase = serverSupabaseServiceRole(event)

  const { data: ws } = await supabase
    .from('workspaces')
    .select('ai_config')
    .eq('id', workspaceId)
    .single()

  const wsConfig = (ws?.ai_config as Record<string, unknown>) || {}
  const config = getN8nConfig(wsConfig)

  if (!config) {
    return { connected: false, reason: 'not_configured' }
  }

  const healthy = await checkN8nHealth(config)

  if (!healthy) {
    return { connected: false, reason: 'unreachable', url: config.baseUrl }
  }

  // Get workflow count from n8n
  try {
    const list = await listN8nWorkflows(config)
    return {
      connected: true,
      url: config.baseUrl,
      workflowCount: list.data?.length || 0,
    }
  } catch {
    return { connected: true, url: config.baseUrl, workflowCount: 0 }
  }
})
