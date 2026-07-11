import { AwsClient } from 'aws4fetch'

/**
 * Cloudflare R2 storage backend (S3-compatible).
 * Configured via env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
 * When configured, new uploads go to R2; Supabase storage keeps serving
 * existing files and acts as fallback (metadata.storage tells them apart).
 */

let _client: AwsClient | null = null

function r2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
  }
}

export function isR2Configured(): boolean {
  const c = r2Config()
  return !!(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucket)
}

function client(): AwsClient {
  if (!_client) {
    const c = r2Config()
    _client = new AwsClient({
      accessKeyId: c.accessKeyId,
      secretAccessKey: c.secretAccessKey,
      service: 's3',
      region: 'auto',
    })
  }
  return _client
}

function objectUrl(key: string): string {
  const c = r2Config()
  return `https://${c.accountId}.r2.cloudflarestorage.com/${c.bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`
}

export async function r2Put(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
  const res = await client().fetch(objectUrl(key), {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  })
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${await res.text().catch(() => '')}`)
}

export async function r2Delete(key: string): Promise<void> {
  const res = await client().fetch(objectUrl(key), { method: 'DELETE' })
  if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed (${res.status})`)
}

/** Presigned GET URL (default 1 hour) */
export async function r2SignedUrl(key: string, expiresSeconds = 3600): Promise<string> {
  const url = new URL(objectUrl(key))
  url.searchParams.set('X-Amz-Expires', String(expiresSeconds))
  const signed = await client().sign(new Request(url.toString(), { method: 'GET' }), {
    aws: { signQuery: true },
  })
  return signed.url
}
