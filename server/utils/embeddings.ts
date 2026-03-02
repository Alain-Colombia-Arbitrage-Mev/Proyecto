const EMBEDDING_MODEL = 'openai/text-embedding-3-small'
const EMBEDDING_DIMS = 1536
const MAX_INPUT_CHARS = 8000

interface EmbeddingTokenTracker {
  supabase: any
  userId: string
  workspaceId: string
}

/**
 * Generate an embedding vector for the given text using OpenRouter.
 * Optionally records token usage if tracker params are provided.
 */
export async function generateEmbedding(text: string, tracker?: EmbeddingTokenTracker): Promise<number[]> {
  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) throw new Error('OpenRouter API key not configured')

  const truncated = text.slice(0, MAX_INPUT_CHARS)

  const response = await $fetch<any>('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://focusflow.app',
      'X-Title': 'FocusFlow',
    },
    body: {
      model: EMBEDDING_MODEL,
      input: truncated,
    },
  })

  const embedding = response?.data?.[0]?.embedding
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMS) {
    throw new Error(`Invalid embedding response: expected ${EMBEDDING_DIMS} dims`)
  }

  // Record embedding token usage if tracker provided
  if (tracker && response?.usage) {
    recordTokenUsage({
      supabase: tracker.supabase,
      userId: tracker.userId,
      workspaceId: tracker.workspaceId,
      action: 'embedding',
      model: EMBEDDING_MODEL,
      usage: response.usage,
    }).catch(() => {})
  }

  return embedding
}

interface StoreMemoryParams {
  supabase: any
  workspaceId: string
  contentText: string
  agentType?: string
  contentType?: string
  projectId?: string | null
  metadata?: Record<string, unknown>
  createdBy?: string | null
}

/**
 * Store a memory with its embedding into the database.
 * Fire-and-forget safe — catches and logs errors.
 */
export async function storeMemory(params: StoreMemoryParams): Promise<void> {
  const {
    supabase,
    workspaceId,
    contentText,
    agentType = 'memory',
    contentType = 'chat',
    projectId = null,
    metadata = {},
    createdBy = null,
  } = params

  try {
    const embedding = await generateEmbedding(contentText)

    const { error } = await supabase
      .from('memory_embeddings')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        agent_type: agentType,
        content_type: contentType,
        content_text: contentText.slice(0, 10000),
        embedding: JSON.stringify(embedding),
        metadata,
        created_by: createdBy,
      })

    if (error) {
      console.error('[memory] Store error:', error.message)
    }
  } catch (err: any) {
    console.error('[memory] Failed to store memory:', err.message)
  }
}

interface SearchMemoriesParams {
  supabase: any
  workspaceId: string
  query: string
  agentType?: string | null
  limit?: number
  threshold?: number
}

export interface MemorySearchResult {
  id: string
  content_text: string
  content_type: string
  agent_type: string
  metadata: Record<string, unknown>
  similarity: number
  created_at: string
}

/**
 * Search for similar memories using vector similarity.
 */
export async function searchMemories(params: SearchMemoriesParams): Promise<MemorySearchResult[]> {
  const {
    supabase,
    workspaceId,
    query,
    agentType = null,
    limit = 5,
    threshold = 0.65,
  } = params

  const embedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: JSON.stringify(embedding),
    p_workspace_id: workspaceId,
    p_agent_type: agentType,
    p_limit: limit,
    p_threshold: threshold,
  })

  if (error) {
    console.error('[memory] Search error:', error.message)
    return []
  }

  return (data || []) as MemorySearchResult[]
}
