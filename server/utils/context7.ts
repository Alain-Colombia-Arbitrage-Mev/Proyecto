const CONTEXT7_BASE_URL = 'https://context7.com/api/v1'

function getContext7Headers(): Record<string, string> {
  const { context7Key } = useRuntimeConfig()
  const headers: Record<string, string> = {}
  if (context7Key) {
    headers['Authorization'] = `Bearer ${context7Key}`
  }
  return headers
}

interface Context7Library {
  id: string
  title: string
}

interface Context7LibraryDoc {
  content: string
  title?: string
  tokens?: number
}

/**
 * Resolve a library name to its Context7 library ID.
 * Returns null if not found or on error.
 */
export async function resolveLibrary(name: string): Promise<Context7Library | null> {
  try {
    const response = await $fetch<any>(`${CONTEXT7_BASE_URL}/search`, {
      method: 'GET',
      params: { query: name },
      headers: getContext7Headers(),
      timeout: 8000,
    })

    const results = response?.results || response?.data || response
    if (Array.isArray(results) && results.length > 0) {
      const best = results[0]
      return {
        id: best.id || best.library_id || '',
        title: best.title || best.name || name,
      }
    }

    return null
  } catch (err: any) {
    console.error(`[context7] Failed to resolve library "${name}":`, err.message)
    return null
  }
}

/**
 * Fetch documentation for a specific library from Context7.
 * Returns null on error.
 */
export async function fetchLibraryDocs(
  libraryId: string,
  options: { topic?: string; maxTokens?: number } = {}
): Promise<Context7LibraryDoc | null> {
  const { topic, maxTokens = 5000 } = options

  try {
    const params: Record<string, any> = {
      max_tokens: maxTokens,
    }
    if (topic) params.topic = topic

    const response = await $fetch<any>(`${CONTEXT7_BASE_URL}/libraries/${libraryId}/docs`, {
      method: 'GET',
      params,
      headers: getContext7Headers(),
      timeout: 15000,
    })

    if (response?.content || response?.text) {
      return {
        content: response.content || response.text || '',
        title: response.title,
        tokens: response.tokens,
      }
    }

    return null
  } catch (err: any) {
    console.error(`[context7] Failed to fetch docs for library "${libraryId}":`, err.message)
    return null
  }
}

/**
 * High-level: resolve a library name and fetch its documentation.
 * Returns empty string on any error — never blocks the calling agent.
 */
export async function getLibraryDocumentation(name: string, topic?: string): Promise<string> {
  try {
    const library = await resolveLibrary(name)
    if (!library?.id) return ''

    const docs = await fetchLibraryDocs(library.id, { topic, maxTokens: 5000 })
    if (!docs?.content) return ''

    return `### ${library.title}${topic ? ` (${topic})` : ''}\n${docs.content}`
  } catch (err: any) {
    console.error(`[context7] getLibraryDocumentation error for "${name}":`, err.message)
    return ''
  }
}
