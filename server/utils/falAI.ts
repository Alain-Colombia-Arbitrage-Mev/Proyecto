/**
 * fal.ai queue client — runs media models (Seedance 2.0 video, etc.).
 * Env: FAL_KEY (from fal.ai dashboard).
 */

export function isFalConfigured(): boolean {
  return !!process.env.FAL_KEY
}

/**
 * Submit a request to fal's queue and poll until completion.
 * Returns the model output object. Throws on failure/timeout.
 */
export async function falRun(model: string, input: Record<string, any>, opts?: { timeoutMs?: number }): Promise<any> {
  const key = process.env.FAL_KEY
  if (!key) throw new Error('FAL_KEY not configured')

  const headers = { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' }

  // Submit to queue
  const submit = await $fetch<any>(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers,
    body: input,
  })

  const statusUrl = submit.status_url || `https://queue.fal.run/${model}/requests/${submit.request_id}/status`
  const responseUrl = submit.response_url || `https://queue.fal.run/${model}/requests/${submit.request_id}`

  const timeoutMs = opts?.timeoutMs ?? 240_000
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000))
    const status = await $fetch<any>(statusUrl, { headers }).catch(() => null)
    if (!status) continue
    if (status.status === 'COMPLETED') {
      return await $fetch<any>(responseUrl, { headers })
    }
    if (status.status === 'FAILED' || status.status === 'CANCELLED') {
      throw new Error(`fal.ai ${model} ${status.status}: ${JSON.stringify(status.error || {}).slice(0, 300)}`)
    }
  }
  throw new Error(`fal.ai ${model} timed out after ${Math.round(timeoutMs / 1000)}s`)
}
