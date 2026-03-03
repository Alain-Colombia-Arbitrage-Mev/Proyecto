/**
 * Fire-and-forget translation of task title + description to English.
 * Uses the same OpenRouter API already configured in the project.
 */
export async function translateTaskToEnglish(opts: {
  supabase: any
  taskId: string
  title: string
  description: string | null
}): Promise<void> {
  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) return

  const { supabase, taskId, title, description } = opts

  try {
    const userContent = description
      ? `Translate to English:\n\nTitle: ${title}\n\nDescription:\n${description}`
      : `Translate to English:\n\nTitle: ${title}`

    const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://focusflow.app',
        'X-Title': 'FocusFlow',
      },
      body: {
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given Spanish text to English.
Respond ONLY with a JSON object:
{
  "title_en": "translated title",
  "description_en": "translated description (preserve markdown formatting)"
}
If there is no description, set description_en to null.
Do not add explanations. Do not use <think> tags. Respond ONLY with the JSON.`,
          },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      },
    })

    const content = response.choices?.[0]?.message?.content || ''
    let parsed: any = null

    // Try to parse JSON
    try { parsed = JSON.parse(content.trim()) } catch {}
    if (!parsed) {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) try { parsed = JSON.parse(match[0]) } catch {}
    }

    if (parsed?.title_en) {
      const updates: Record<string, unknown> = {
        title_en: String(parsed.title_en).slice(0, 500),
      }
      if (parsed.description_en) {
        updates.description_en = String(parsed.description_en).slice(0, 10000)
      }
      await supabase.from('tasks').update(updates).eq('id', taskId)
    }
  } catch (err: any) {
    console.error('[translate] Failed to translate task:', err.message)
  }
}
