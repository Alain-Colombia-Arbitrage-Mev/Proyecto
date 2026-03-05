/**
 * Prompt optimization — now done at compile-time via compact prompts
 * instead of runtime LLM calls. No-op passthrough for backward compatibility.
 */

export function shouldSkipOptimization(_action: string): boolean {
  return true // All optimization is now done at the prompt-writing level
}

interface OptimizePromptParams {
  systemPrompt: string
  userPrompt: string
  skipOptimization?: boolean
}

interface OptimizePromptResult {
  systemPrompt: string
  userPrompt: string
  optimized: boolean
  savedTokensEstimate?: number
}

/** No-op passthrough — prompts are already optimized at write-time */
export async function optimizePrompt(params: OptimizePromptParams): Promise<OptimizePromptResult> {
  return { systemPrompt: params.systemPrompt, userPrompt: params.userPrompt, optimized: false }
}
