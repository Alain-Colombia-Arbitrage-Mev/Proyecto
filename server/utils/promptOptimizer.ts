const OPTIMIZER_MODEL = 'meta-llama/llama-3.1-8b-instruct'
const OPTIMIZATION_THRESHOLD = 2000

/** Actions that should skip prompt optimization */
const SKIP_OPTIMIZATION_ACTIONS = new Set([
  'break_down_task',
  'improve_task',
  'suggest_tasks',
])

export function shouldSkipOptimization(action: string): boolean {
  return SKIP_OPTIMIZATION_ACTIONS.has(action)
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

/**
 * Optimize prompts by compressing them via a fast/cheap LLM.
 * Only optimizes if combined length exceeds threshold.
 * Falls back gracefully to original prompts on error.
 */
export async function optimizePrompt(params: OptimizePromptParams): Promise<OptimizePromptResult> {
  const { systemPrompt, userPrompt, skipOptimization = false } = params

  const combinedLength = systemPrompt.length + userPrompt.length

  if (skipOptimization || combinedLength <= OPTIMIZATION_THRESHOLD) {
    return { systemPrompt, userPrompt, optimized: false }
  }

  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) {
    return { systemPrompt, userPrompt, optimized: false }
  }

  try {
    const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://focusflow.app',
        'X-Title': 'FocusFlow',
      },
      body: {
        model: OPTIMIZER_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a prompt compressor. Given a system prompt and user prompt, compress them to reduce token count while preserving ALL instructions, constraints, output format requirements, and essential context. Return JSON with "systemPrompt" and "userPrompt" keys. Keep the same language (Spanish). Do NOT remove output format specifications or JSON schema requirements. Respond ONLY with the JSON object.`,
          },
          {
            role: 'user',
            content: `Compress these prompts:\n\nSYSTEM PROMPT:\n${systemPrompt}\n\nUSER PROMPT:\n${userPrompt}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      },
    })

    const content = response.choices?.[0]?.message?.content || ''

    // Try to parse the optimized prompts
    let parsed: any = null
    try {
      parsed = JSON.parse(content.trim())
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]) } catch {}
      }
    }

    if (parsed?.systemPrompt && parsed?.userPrompt) {
      const newLength = parsed.systemPrompt.length + parsed.userPrompt.length
      const savedEstimate = Math.max(0, Math.round((combinedLength - newLength) / 4))

      // Record optimizer token usage
      if (response.usage) {
        console.log(`[promptOptimizer] Optimized: ${combinedLength} → ${newLength} chars (~${savedEstimate} tokens saved). Optimizer used ${response.usage.total_tokens || 0} tokens.`)
      }

      return {
        systemPrompt: parsed.systemPrompt,
        userPrompt: parsed.userPrompt,
        optimized: true,
        savedTokensEstimate: savedEstimate,
      }
    }

    console.warn('[promptOptimizer] Could not parse optimizer response, using original prompts')
    return { systemPrompt, userPrompt, optimized: false }
  } catch (err: any) {
    console.error('[promptOptimizer] Optimization failed:', err.message)
    return { systemPrompt, userPrompt, optimized: false }
  }
}
