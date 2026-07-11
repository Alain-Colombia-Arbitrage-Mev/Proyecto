import { serverSupabaseServiceRole } from '#supabase/server'
import { mcpListTools, HIGGSFIELD_MCP_URL, isHiggsfieldServer, validateMcpServerUrl } from '~~/server/utils/mcpClient'

/** List tools exposed by an external MCP server (for the mcp_tool node config UI). */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'use_workflows')

  const body = await readBody(event)
  let serverUrl: string
  try {
    serverUrl = validateMcpServerUrl(String(body.server_url || HIGGSFIELD_MCP_URL))
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }

  // Stored Higgsfield token is only ever attached to the exact Higgsfield host
  const supabase = serverSupabaseServiceRole(event)
  const { data: ws } = await supabase.from('workspaces').select('ai_config').eq('id', workspaceId).maybeSingle()
  const storedToken = ((ws?.ai_config as any)?.workflow_api_keys?.higgsfield_mcp) || ''
  const token = String(body.auth_token || '') || (isHiggsfieldServer(serverUrl) ? storedToken : '')

  try {
    const tools = await mcpListTools(serverUrl, token || undefined)
    return { tools: tools.map(t => ({ name: t.name, description: (t.description || '').slice(0, 200) })) }
  } catch (e: any) {
    console.error('[mcp-tools] upstream error:', e.message)
    throw createError({ statusCode: 502, message: 'Could not reach the MCP server or it rejected the request' })
  }
})
