/**
 * Token-optimized translation using compact prompts and batching.
 * Uses short keys (t/d) and batches multiple tasks per API call.
 */

const TRANSLATE_MODEL = 'qwen/qwen3-coder-next'

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

/** Strip HTML tags to get plain text for translation */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function tryParseJson(raw: string): any {
  const cleaned = stripThinkTags(raw)
  try { return JSON.parse(cleaned.trim()) } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) try { return JSON.parse(match[0]) } catch {}
  return null
}

// ── Single task translation (used on create/edit) ─────────────────────

export async function translateTaskToEnglish(opts: {
  supabase: any
  taskId: string
  title: string
  description: string | null
}): Promise<void> {
  return translateTaskToAll(opts)
}

export async function translateTaskToAll(opts: {
  supabase: any
  taskId: string
  title: string
  description: string | null
  sourceLang?: string
}): Promise<void> {
  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) return

  const { supabase, taskId, title, description } = opts
  const cleanDesc = description ? stripHtml(description).slice(0, 400) : ''

  // Compact prompt: ~15 system tokens + minimal user tokens
  // Format: "t:title|d:description" → {"en":{"t":"","d":""},"ur":{"t":"","d":""}}
  const input = cleanDesc ? `t:${title}|d:${cleanDesc}` : `t:${title}`

  try {
    const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: TRANSLATE_MODEL,
        messages: [
          { role: 'system', content: 'ES→EN,UR. JSON:{en:{t,d},ur:{t,d}}. d=null if empty.' },
          { role: 'user', content: input },
        ],
        temperature: 0.1,
        max_tokens: 300,
      },
    })

    const parsed = tryParseJson(response.choices?.[0]?.message?.content || '')
    if (!parsed) return

    await applyTranslation(supabase, taskId, parsed)
  } catch (err: any) {
    console.error('[translate] Failed:', err.message)
  }
}

// ── Batch translation (multiple tasks in 1 API call) ──────────────────

export async function translateTasksBatch(opts: {
  supabase: any
  tasks: Array<{ id: string; title: string; description: string | null }>
}): Promise<number> {
  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey || !opts.tasks.length) return 0

  const { supabase, tasks } = opts

  // Build compact batch input:
  // 1:t:titulo|d:desc
  // 2:t:titulo2
  // ...
  const lines = tasks.map((task, i) => {
    const cleanDesc = task.description ? stripHtml(task.description).slice(0, 200) : ''
    return cleanDesc
      ? `${i}:t:${task.title}|d:${cleanDesc}`
      : `${i}:t:${task.title}`
  })

  try {
    const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: TRANSLATE_MODEL,
        messages: [
          { role: 'system', content: 'ES→EN,UR. JSON array, each:{i,en:{t,d},ur:{t,d}}. d=null if empty.' },
          { role: 'user', content: lines.join('\n') },
        ],
        temperature: 0.1,
        max_tokens: Math.min(tasks.length * 150, 4000),
      },
    })

    const parsed = tryParseJson(response.choices?.[0]?.message?.content || '')
    if (!parsed) return 0

    // parsed should be an array like [{i:0,en:{t,d},ur:{t,d}}, ...]
    const results = Array.isArray(parsed) ? parsed : [parsed]
    let count = 0

    for (const result of results) {
      const idx = result.i ?? result.idx ?? 0
      const task = tasks[idx]
      if (!task) continue

      try {
        await applyTranslation(supabase, task.id, result)
        count++
      } catch (err: any) {
        console.error(`[translate-batch] Failed task ${task.id}:`, err.message)
      }
    }

    return count
  } catch (err: any) {
    console.error('[translate-batch] API error:', err.message)
    return 0
  }
}

// ── Shared: apply parsed translation to DB ────────────────────────────

async function applyTranslation(
  supabase: any,
  taskId: string,
  parsed: { en?: { t?: string; d?: string; title?: string; description?: string }; ur?: { t?: string; d?: string; title?: string; description?: string } },
): Promise<void> {
  const updates: Record<string, unknown> = {}

  // Support both compact (t/d) and full (title/description) keys
  const enTitle = parsed.en?.t || parsed.en?.title
  const enDesc = parsed.en?.d || parsed.en?.description
  const urTitle = parsed.ur?.t || parsed.ur?.title
  const urDesc = parsed.ur?.d || parsed.ur?.description

  if (enTitle) updates.title_en = String(enTitle).slice(0, 500)
  if (enDesc) updates.description_en = String(enDesc).slice(0, 10000)

  if (urTitle || urDesc) {
    let existing: Record<string, any> = {}
    try {
      const { data } = await supabase.from('tasks').select('translations').eq('id', taskId).maybeSingle()
      existing = (data?.translations as any) || {}
    } catch {}
    updates.translations = {
      ...existing,
      ur: {
        ...(existing.ur || {}),
        title: urTitle ? String(urTitle).slice(0, 500) : (existing.ur?.title || null),
        description: urDesc ? String(urDesc).slice(0, 10000) : (existing.ur?.description || null),
      },
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('tasks').update(updates).eq('id', taskId)
  }
}
