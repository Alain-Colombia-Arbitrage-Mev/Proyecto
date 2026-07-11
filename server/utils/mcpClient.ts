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

/** Loopback, RFC1918, link-local (incl. cloud metadata), CGNAT, ULA — all blocked */
function isBlockedAddress(addr: string): boolean {
  const a = addr.toLowerCase()
  if (a.includes(':')) {
    // IPv6 (and IPv4-mapped)
    if (a.startsWith('::ffff:')) return isBlockedAddress(a.slice(7))
    return a === '::1' || a === '::' || a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80')
  }
  const parts = a.split('.').map(Number)
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [p0, p1] = parts as [number, number, number, number]
  if (p0 === 0 || p0 === 127 || p0 === 10) return true
  if (p0 === 172 && p1! >= 16 && p1! <= 31) return true
  if (p0 === 192 && p1 === 168) return true
  if (p0 === 169 && p1 === 254) return true // link-local / cloud metadata (169.254.169.254)
  if (p0 === 100 && p1! >= 64 && p1! <= 127) return true // CGNAT
  return false
}

/**
 * Validate an external MCP server URL (SSRF guard): https on port 443 only,
 * no IP literals or internal hostnames, and the hostname must not RESOLVE
 * to any private/loopback/link-local address.
 * Returns the normalized URL string or throws.
 */
export async function validateMcpServerUrl(raw: string): Promise<string> {
  let url: URL
  try { url = new URL(String(raw).slice(0, 500)) } catch { throw new Error('Invalid MCP server URL') }
  if (url.protocol !== 'https:') throw new Error('MCP server URL must be https')
  if (url.port && url.port !== '443') throw new Error('MCP server port must be 443')
  if (url.username || url.password) throw new Error('MCP server URL cannot contain credentials')

  const host = url.hostname.toLowerCase()
  const isIpV4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  const isIpV6 = host.includes(':') || host.startsWith('[')
  if (isIpV4 || isIpV6) throw new Error('MCP server URL cannot be an IP address')
  if (
    host === 'localhost'
    || host.endsWith('.localhost')
    || host.endsWith('.local')
    || host.endsWith('.internal')
    || !host.includes('.')
  ) throw new Error('MCP server host not allowed')

  // Resolve and reject hostnames pointing at internal ranges
  try {
    const { lookup } = await import('node:dns/promises')
    const addresses = await lookup(host, { all: true })
    if (!addresses.length) throw new Error('unresolvable')
    for (const rec of addresses) {
      if (isBlockedAddress(rec.address)) throw new Error('blocked-range')
    }
  } catch (e: any) {
    if (e.message === 'blocked-range') throw new Error('MCP server host resolves to a private address')
    throw new Error('MCP server host could not be resolved')
  }

  return url.toString()
}
