interface RecordTokenUsageParams {
  supabase: any
  userId: string
  workspaceId: string
  action: string
  model: string
  usage: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

/**
 * Record token usage for an AI call. Fire-and-forget safe.
 */
export async function recordTokenUsage(params: RecordTokenUsageParams): Promise<void> {
  const { supabase, userId, workspaceId, action, model, usage } = params

  const prompt_tokens = usage.prompt_tokens || 0
  const completion_tokens = usage.completion_tokens || 0
  const total_tokens = usage.total_tokens || (prompt_tokens + completion_tokens)

  if (total_tokens === 0) return

  try {
    const { error } = await supabase
      .from('ai_token_usage')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        action,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens,
      })

    if (error) {
      console.error('[tokens] Record error:', error.message)
    }
  } catch (err: any) {
    console.error('[tokens] Failed to record usage:', err.message)
  }
}

interface TokenUsageStats {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  limit: number
  percentUsed: number
  byAction: Record<string, number>
  byDay: { date: string; tokens: number }[]
}

/**
 * Get aggregated token usage for a workspace in the current billing month.
 */
export async function getWorkspaceTokenUsage(params: {
  supabase: any
  workspaceId: string
}): Promise<TokenUsageStats> {
  const { supabase, workspaceId } = params

  // Current month boundaries
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Fetch all rows for the month
  const { data: rows, error } = await supabase
    .from('ai_token_usage')
    .select('action, prompt_tokens, completion_tokens, total_tokens, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', monthStart)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[tokens] Fetch error:', error.message)
  }

  const records = (rows || []) as Array<{
    action: string
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    created_at: string
  }>

  // Aggregate totals
  let totalTokens = 0
  let promptTokens = 0
  let completionTokens = 0
  const byAction: Record<string, number> = {}
  const byDayMap: Record<string, number> = {}

  for (const r of records) {
    totalTokens += r.total_tokens
    promptTokens += r.prompt_tokens
    completionTokens += r.completion_tokens

    byAction[r.action] = (byAction[r.action] || 0) + r.total_tokens

    const day = r.created_at.slice(0, 10)
    byDayMap[day] = (byDayMap[day] || 0) + r.total_tokens
  }

  const byDay = Object.entries(byDayMap).map(([date, tokens]) => ({ date, tokens }))

  // Get workspace limit
  const { data: ws } = await supabase
    .from('workspaces')
    .select('token_limit')
    .eq('id', workspaceId)
    .maybeSingle()

  const limit = ws?.token_limit || 50_000_000
  const percentUsed = limit > 0 ? Math.round((totalTokens / limit) * 100) : 0

  return { totalTokens, promptTokens, completionTokens, limit, percentUsed, byAction, byDay }
}

/**
 * Check if workspace has exceeded its token limit.
 * Returns true if over limit.
 */
export async function isTokenLimitExceeded(params: {
  supabase: any
  workspaceId: string
}): Promise<boolean> {
  const stats = await getWorkspaceTokenUsage(params)
  return stats.percentUsed >= 100
}
