/**
 * Auto-translate text fields to other languages using a lightweight LLM.
 * Designed for translating task/goal descriptions on save.
 */
export function useAutoTranslate() {
  const { language } = useLanguage()
  const translating = ref(false)

  const ALL_LANGS = ['es', 'en', 'ur'] as const

  /**
   * Translate text to all other languages.
   * @param text The source text
   * @param fromLang Source language (defaults to current UI language)
   * @param workspaceId Optional workspace ID for token tracking
   * @returns Record of language code → translated text (excludes source lang)
   */
  async function translate(
    text: string,
    fromLang?: string,
    workspaceId?: string,
  ): Promise<Record<string, string>> {
    if (!text?.trim()) return {}

    const source = fromLang || language.value
    const targetLangs = ALL_LANGS.filter(l => l !== source)

    if (!targetLangs.length) return {}

    translating.value = true
    try {
      const { translations } = await $fetch<{ translations: Record<string, string> }>('/api/ai/translate', {
        method: 'POST',
        body: { text, from: source, to: targetLangs, workspace_id: workspaceId },
      })
      return translations || {}
    } catch (err) {
      console.warn('[useAutoTranslate] failed:', err)
      return {}
    } finally {
      translating.value = false
    }
  }

  return { translate, translating }
}
