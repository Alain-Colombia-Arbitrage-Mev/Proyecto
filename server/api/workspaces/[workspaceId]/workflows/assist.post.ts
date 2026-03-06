import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'use_workflows')
  const user = await requireUser(event)

  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) throw createError({ statusCode: 500, message: 'OpenRouter API key not configured' })

  const body = await readBody(event)
  const { message, currentNodes, workflowType, history } = body

  if (!message || typeof message !== 'string') {
    throw createError({ statusCode: 400, message: 'message is required' })
  }

  const nodeTypesSpec = `
Available node types:
- trigger: Start node
- ai_prompt: Send prompt to AI model. Config: { model: string, prompt: string }
- ai_agent: Autonomous AI agent. Config: { model: string, prompt: string }
- social_post: Post to social media. Config: { platform: "instagram"|"twitter"|"linkedin"|"tiktok", caption: string, hashtags: string }
- video_generate: Generate video with Runway. Config: { runway_model: "gen3a_turbo"|"gen3a"|"gen4_turbo", prompt: string, duration: 5|10, style: "cinematic"|"anime"|"3d_render"|"photorealistic"|"watercolor" }
- image_generate: Generate image. Config: { prompt: string }
- send_email: Send email. Config: { to: string, subject: string, body: string }
- webhook: Call external endpoint. Config: { url: string, method: "POST"|"GET"|"PUT" }
- http_request: Custom HTTP request. Config: { method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE", url: string, headers: string, request_body: string }
- condition: Branch logic. Config: { expression: string }
- delay: Wait. Config: { seconds: number }
- transform: Transform data. Config: { template: string }
- output: Final output node. Config: {}
`

  const systemPrompt = `You are a workflow builder AI assistant for FocusFlow, a project management platform.
Help users build automated workflows by suggesting nodes to add, modifying existing nodes, or creating complete workflows.

${nodeTypesSpec}

Current workflow type: ${workflowType || 'ai_agent'}
Current nodes: ${JSON.stringify(currentNodes || [])}

IMPORTANT: When the user asks to create, add, or modify nodes, respond with JSON in this format:
{
  "message": "Your explanation in the user's language",
  "actions": [
    { "action": "add", "node": { "type": "ai_prompt", "label": "Name", "config": { ... } } },
    { "action": "add", "node": { "type": "social_post", "label": "Post", "config": { ... } } },
    { "action": "remove", "index": 0 },
    { "action": "update", "index": 1, "changes": { "label": "New name", "config": { ... } } },
    { "action": "replace_all", "nodes": [ ... ] }
  ]
}

If the user is just asking questions or chatting, respond with:
{ "message": "Your response" }

Always respond in the same language the user uses (Spanish or English).
Keep messages concise and helpful. Suggest best practices for workflow design.
ONLY output valid JSON. No markdown wrapping.`

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Add conversation history (max 10 messages)
  if (Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      if (h.role === 'user' || h.role === 'assistant') {
        messages.push({ role: h.role, content: String(h.content).slice(0, 5000) })
      }
    }
  }

  messages.push({ role: 'user', content: message.slice(0, 5000) })

  const supabase = serverSupabaseServiceRole(event)

  try {
    const response = await $fetch<{ choices: { message: { content: string } }[] }>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openrouterApiKey}`, 'Content-Type': 'application/json' },
      body: {
        model: 'openai/gpt-4o-mini',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      },
    })

    const raw = response.choices?.[0]?.message?.content || ''

    // Try to parse as JSON
    let parsed: any = null
    try { parsed = JSON.parse(raw.trim()) } catch {}
    if (!parsed) {
      const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
      if (jsonMatch?.[1]) try { parsed = JSON.parse(jsonMatch[1].trim()) } catch {}
    }
    if (!parsed) {
      const firstBrace = raw.indexOf('{')
      if (firstBrace !== -1) {
        let depth = 0
        for (let i = firstBrace; i < raw.length; i++) {
          if (raw[i] === '{') depth++
          else if (raw[i] === '}') depth--
          if (depth === 0) {
            try { parsed = JSON.parse(raw.slice(firstBrace, i + 1)) } catch {}
            break
          }
        }
      }
    }

    // Track token usage
    try {
      await supabase.from('ai_usage_log').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        action: 'workflow_assist',
        tokens_used: raw.length,
        created_at: new Date().toISOString(),
      })
    } catch {}

    return parsed || { message: raw }
  } catch (e: any) {
    throw createError({ statusCode: 500, message: e.message || 'AI request failed' })
  }
})
