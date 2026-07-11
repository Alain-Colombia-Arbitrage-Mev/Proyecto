/**
 * Minimal MCP (Model Context Protocol) HTTP client — JSON-RPC 2.0.
 * Lets workflows call external MCP servers like Higgsfield
 * (https://mcp.higgsfield.ai/mcp — Seedance 2.0, Veo 3.1, Kling 3.0,
 * GPT Image 2, Soul V2 and more).
 */

interface McpToolInfo {
  name: string
  description?: string
  inputSchema?: Record<string, any>
}

let rpcId = 1

async function rpc(serverUrl: string, authToken: string | undefined, method: string, params?: Record<string, any>): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const res = await $fetch<any>(serverUrl, {
    method: 'POST',
    headers,
    body: { jsonrpc: '2.0', id: rpcId++, method, params: params || {} },
    timeout: 120_000,
    redirect: 'error', // a redirect could escape the SSRF hostname validation
  })

  if (res?.error) throw new Error(`MCP ${method} error: ${res.error.message || JSON.stringify(res.error).slice(0, 200)}`)
  return res?.result
}

export async function mcpListTools(serverUrl: string, authToken?: string): Promise<McpToolInfo[]> {
  // Some servers require initialize first — try tools/list directly, fall back to init + retry
  try {
    const result = await rpc(serverUrl, authToken, 'tools/list')
    return result?.tools || []
  } catch {
    await rpc(serverUrl, authToken, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'FocusFlow', version: '1.0.0' },
    }).catch(() => {})
    const result = await rpc(serverUrl, authToken, 'tools/list')
    return result?.tools || []
  }
}

export async function mcpCallTool(serverUrl: string, authToken: string | undefined, toolName: string, args: Record<string, any>): Promise<any> {
  const result = await rpc(serverUrl, authToken, 'tools/call', { name: toolName, arguments: args })
  // MCP content is [{type:'text', text}, ...] — unwrap single-text results, try JSON parse
  const content = result?.content
  if (Array.isArray(content)) {
    const texts = content.filter((c: any) => c.type === 'text').map((c: any) => c.text)
    if (texts.length === 1) {
      try { return JSON.parse(texts[0]) } catch { return texts[0] }
    }
    if (texts.length > 1) return texts
  }
  return result
}

export const HIGGSFIELD_MCP_URL = 'https://mcp.higgsfield.ai/mcp'
const HIGGSFIELD_HOST = 'mcp.higgsfield.ai'

/** Exact-hostname check — never use substring matching to decide credential attachment */
export function isHiggsfieldServer(serverUrl: string): boolean {
  try { return new URL(serverUrl).hostname === HIGGSFIELD_HOST } catch { return false }
}

/**
 * Validate an external MCP server URL: https only, no IP literals,
 * no loopback/private/link-local/internal hostnames (SSRF guard).
 * Returns the normalized URL string or throws.
 */
export function validateMcpServerUrl(raw: string): string {
  let url: URL
  try { url = new URL(String(raw).slice(0, 500)) } catch { throw new Error('Invalid MCP server URL') }
  if (url.protocol !== 'https:') throw new Error('MCP server URL must be https')

  const host = url.hostname.toLowerCase()
  const isIpV4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  const isIpV6 = host.includes(':') || host.startsWith('[')
  if (isIpV4 || isIpV6) throw new Error('MCP server URL cannot be an IP address')
  if (
    host === 'localhost'
    || host.endsWith('.localhost')
    || host.endsWith('.local')
    || host.endsWith('.internal')
    || host.endsWith('.railway.internal')
    || !host.includes('.')
  ) throw new Error('MCP server host not allowed')

  return url.toString()
}
