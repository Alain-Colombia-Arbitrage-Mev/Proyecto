/**
 * Fire-and-forget translation of task title + description to other languages.
 * Uses a lightweight model (qwen3-0.6b) for minimal token cost.
 */

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

const LANG_NAMES: Record<string, string> = {
  es: 'Spanish',
  en: 'English',
  ur: 'Urdu',
}

export async function translateTaskToEnglish(opts: {
  supabase: any
  taskId: string
  title: string
  description: string | null
}): Promise<void> {
  // Now translates to both English and Urdu
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

  const { supabase, taskId, title, description, sourceLang = 'es' } = opts

  // Determine which languages we need translations for
  const targetLangs = Object.keys(LANG_NAMES).filter(l => l !== sourceLang)
  if (!targetLangs.length) return

  const targetList = targetLangs.map(l => `${LANG_NAMES[l]} (${l})`).join(', ')

  try {
    // Strip HTML tags from description (TipTap editor produces HTML)
    const cleanDesc = description ? stripHtml(description) : null
    const textBlock = cleanDesc
      ? `Title: ${title}\nDescription: ${cleanDesc.slice(0, 500)}`
      : `Title: ${title}`

    const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://focusflow.app',
        'X-Title': 'FocusFlow',
      },
      body: {
        model: 'qwen/qwen3-coder-next',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the given text from ${LANG_NAMES[sourceLang] || sourceLang} to ${targetList}.
Respond ONLY with a JSON object like:
{
  "en": { "title": "...", "description": "..." },
  "ur": { "title": "...", "description": "..." }
}
If there is no description, set description to null. No explanations, no markdown wrapping.`,
          },
          { role: 'user', content: textBlock },
        ],
        temperature: 0.1,
        max_tokens: 500,
      },
    })

    const content = stripThinkTags(response.choices?.[0]?.message?.content || '')
    let parsed: any = null

    try { parsed = JSON.parse(content.trim()) } catch {}
    if (!parsed) {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) try { parsed = JSON.parse(match[0]) } catch {}
    }

    if (!parsed) return

    // Build update payload for the task
    const updates: Record<string, unknown> = {}

    // English fields use the existing title_en / description_en columns
    if (parsed.en?.title) {
      updates.title_en = String(parsed.en.title).slice(0, 500)
    }
    if (parsed.en?.description) {
      updates.description_en = String(parsed.en.description).slice(0, 10000)
    }

    // For Urdu and other non-ES/EN languages, store in JSONB translations field
    // First fetch existing translations to merge
    if (parsed.ur) {
      let existing: Record<string, any> = {}
      try {
        const { data: currentTask } = await supabase.from('tasks').select('translations').eq('id', taskId).maybeSingle()
        existing = (currentTask?.translations as any) || {}
      } catch {}
      updates.translations = {
        ...existing,
        ur: {
          ...(existing.ur || {}),
          title: parsed.ur.title ? String(parsed.ur.title).slice(0, 500) : (existing.ur?.title || null),
          description: parsed.ur.description ? String(parsed.ur.description).slice(0, 10000) : (existing.ur?.description || null),
        },
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('tasks').update(updates).eq('id', taskId)
    }
  } catch (err: any) {
    console.error('[translate] Failed to translate task:', err.message)
  }
}
