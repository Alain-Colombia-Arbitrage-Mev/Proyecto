import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Lightweight translation endpoint using a cheap/fast model.
 * Translates text to target languages in a single call.
 *
 * Body: { text: string, from?: string, to: string[] }
 * Response: { translations: Record<string, string> }
 */

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text, from, to } = body as { text: string; from?: string; to: string[] }

  if (!text?.trim() || !to?.length) {
    throw createError({ statusCode: 400, message: 'text and to[] are required' })
  }

  // Max 500 chars to keep costs minimal
  const truncated = text.slice(0, 500)

  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) {
    throw createError({ statusCode: 500, message: 'OpenRouter API key not configured' })
  }

  const langNames: Record<string, string> = {
    es: 'Spanish',
    en: 'English',
    ur: 'Urdu',
  }

  const targetLangs = to.map(l => langNames[l] || l).join(', ')
  const fromLang = from ? (langNames[from] || from) : 'auto-detect'

  const prompt = `Translate the following text from ${fromLang} to ${targetLangs}. Return ONLY a JSON object with language codes as keys and translations as values. No explanation.

Text: "${truncated}"

Example response for to=["en","ur"]: {"en":"Hello","ur":"ہیلو"}`

  try {
    const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'qwen/qwen3-coder-next',
        messages: [
          { role: 'system', content: 'You are a translator. Return only valid JSON. No explanation, no markdown.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.1,
      },
    })

    const raw = response?.choices?.[0]?.message?.content || ''
    const cleaned = stripThinkTags(raw)

    // Try to parse JSON from response
    let translations: Record<string, string> = {}
    try {
      translations = JSON.parse(cleaned.trim())
    } catch {
      // Try extracting JSON from markdown block
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        try { translations = JSON.parse(match[0]) } catch {}
      }
    }

    // Track token usage
    const tokensUsed = response?.usage?.total_tokens || 0
    if (tokensUsed > 0) {
      try {
        const supabase = serverSupabaseServiceRole(event)
        const workspaceId = body.workspace_id
        if (workspaceId) {
          await supabase.from('token_usage').insert({
            workspace_id: workspaceId,
            action: 'translate',
            tokens_used: tokensUsed,
            created_at: new Date().toISOString(),
          })
        }
      } catch { /* non-critical */ }
    }

    return { translations }
  } catch (err: any) {
    console.error('[translate] error:', err?.message || err)
    throw createError({ statusCode: 500, message: 'Translation failed' })
  }
})
