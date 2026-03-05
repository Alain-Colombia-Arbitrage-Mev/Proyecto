import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Lightweight translation endpoint. Compact prompt for minimal token usage.
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

  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) {
    throw createError({ statusCode: 500, message: 'OpenRouter API key not configured' })
  }

  const src = from || 'es'
  const targets = to.join(',')
  const truncated = text.slice(0, 500)

  // Compact prompt: ~10 system tokens
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
          { role: 'system', content: `${src.toUpperCase()}→${targets.toUpperCase()}. JSON only: {lang:text}` },
          { role: 'user', content: truncated },
        ],
        max_tokens: 300,
        temperature: 0.1,
      },
    })

    const raw = response?.choices?.[0]?.message?.content || ''
    const cleaned = stripThinkTags(raw)

    let translations: Record<string, string> = {}
    try { translations = JSON.parse(cleaned.trim()) } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) try { translations = JSON.parse(match[0]) } catch {}
    }

    // Track token usage (fire-and-forget)
    const tokensUsed = response?.usage?.total_tokens || 0
    if (tokensUsed > 0 && body.workspace_id) {
      try {
        const supabase = serverSupabaseServiceRole(event)
        await supabase.from('token_usage').insert({
          workspace_id: body.workspace_id,
          action: 'translate',
          tokens_used: tokensUsed,
          created_at: new Date().toISOString(),
        })
      } catch {}
    }

    return { translations }
  } catch (err: any) {
    console.error('[translate] error:', err?.message || err)
    throw createError({ statusCode: 500, message: 'Translation failed' })
  }
})
