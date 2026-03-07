import type { H3Event } from 'h3'
import { createHash, randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Generate a new API token: ff_<48 random hex chars>
 */
export function generateApiToken(): { token: string; hash: string; prefix: string } {
  const raw = randomBytes(24).toString('hex') // 48 hex chars
  const token = `ff_${raw}`
  const hash = hashToken(token)
  const prefix = token.substring(0, 11) // "ff_" + 8 chars
  return { token, hash, prefix }
}

/**
 * SHA-256 hash a token for storage
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Authenticate a request using Bearer token.
 * Returns workspace_id, user_id, scopes if valid.
 */
export async function authenticateApiToken(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ff_')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const hash = hashToken(token)
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, workspace_id, user_id, scopes, expires_at')
    .eq('token_hash', hash)
    .maybeSingle()

  if (error || !data) return null

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return {
    tokenId: data.id as string,
    workspaceId: data.workspace_id as string,
    userId: data.user_id as string,
    scopes: data.scopes as string[],
  }
}
