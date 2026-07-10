/**
 * Shared AI helper for agent-driven server features (MCP tools, orchestration).
 * Primary model: DeepSeek V4 Pro · Fallback: Gemini 2.0 Flash (same as ai/assist).
 */

export interface AgentAIResult {
  content: string
  model: string
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

/** Registry of FocusFlow AI agents with their role and specialty. */
export interface AgentProfile {
  type: string
  name: string
  specialty: string
}

export const AGENT_REGISTRY: AgentProfile[] = [
  { type: 'backend', name: 'Backend Dev', specialty: 'APIs, bases de datos, lógica de negocio, auth, migraciones' },
  { type: 'frontend', name: 'Frontend Dev', specialty: 'UI, componentes, estado, responsive, accesibilidad' },
  { type: 'qa', name: 'QA Engineer', specialty: 'planes de prueba, casos de test, revisión de calidad, regresiones, criterios de aceptación' },
  { type: 'devops', name: 'DevOps', specialty: 'CI/CD, deploy, infraestructura, monitoreo, Docker' },
  { type: 'designer', name: 'Designer', specialty: 'diseño UI/UX, wireframes, prototipos, sistemas de diseño' },
  { type: 'copywriter', name: 'Copywriter', specialty: 'textos de marketing, mensajes, headlines, CTAs' },
  { type: 'content_creator', name: 'Content Creator', specialty: 'artículos, posts para redes, video-guiones, contenido de marca' },
  { type: 'data', name: 'Data Analyst', specialty: 'análisis de datos, métricas, dashboards, reporting' },
  { type: 'security', name: 'Security Specialist', specialty: 'auditoría de seguridad, OWASP, RLS, secretos, permisos' },
  { type: 'seo', name: 'SEO Specialist', specialty: 'SEO técnico, keywords, meta tags, contenido optimizado, Core Web Vitals' },
  { type: 'planner', name: 'Auto Planner', specialty: 'descomposición de objetivos en tareas, estimación, dependencias, sprints' },
  { type: 'reviewer', name: 'Quality Reviewer', specialty: 'mejora de tareas, claridad de requisitos, revisión de entregables' },
  { type: 'orchestrator', name: 'Orchestrator', specialty: 'coordinación de agentes, asignación de trabajo, decisiones de flujo' },
  { type: 'custom', name: 'Custom Agent', specialty: 'agente configurable' },
]

export const VALID_AGENT_TYPES = AGENT_REGISTRY.map(a => a.type)

export function agentRegistryPrompt(): string {
  return AGENT_REGISTRY
    .filter(a => a.type !== 'custom')
    .map(a => `- ${a.type}: ${a.specialty}`)
    .join('\n')
}

/** Compact roster of workspace members + specialty profiles (from ai_config) for AI prompts */
export async function buildMemberRoster(supabase: any, workspaceId: string): Promise<Array<{ id: string; name: string; role: string; specialty?: string; skills?: string[] }>> {
  const [{ data: members }, { data: ws }] = await Promise.all([
    supabase.from('workspace_members').select('user_id, role').eq('workspace_id', workspaceId),
    supabase.from('workspaces').select('ai_config').eq('id', workspaceId).maybeSingle(),
  ])
  const profiles = ((ws?.ai_config as any)?.member_profiles) || {}
  const roster = []
  for (const m of (members || [])) {
    let name = ''
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(m.user_id)
      name = profile?.user?.user_metadata?.full_name || profile?.user?.email || ''
    } catch {}
    const p = profiles[m.user_id] || {}
    roster.push({ id: m.user_id, name, role: p.role_title || m.role, specialty: p.specialty, skills: p.skills })
  }
  return roster
}

export function rosterPrompt(roster: Array<{ id: string; name: string; role: string; specialty?: string; skills?: string[] }>): string {
  return roster
    .map(m => `- id:${m.id} | ${m.name || 'sin nombre'} | rol: ${m.role}${m.specialty ? ` | especialidad: ${m.specialty}` : ''}${m.skills?.length ? ` | skills: ${m.skills.join(', ')}` : ''}`)
    .join('\n') || '(sin miembros con perfil)'
}

/** Strip <think>...</think> blocks that reasoning models produce */
export function stripAgentThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

/** Extract JSON from AI response — handles markdown wrapping, think tags, and extra text */
export function extractAgentJSON(text: string): any | null {
  const cleaned = stripAgentThinkTags(text)

  try { return JSON.parse(cleaned.trim()) } catch {}

  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonBlockMatch?.[1]) {
    try { return JSON.parse(jsonBlockMatch[1].trim()) } catch {}
  }

  const firstBracket = cleaned.search(/[\[{]/)
  if (firstBracket !== -1) {
    const startChar = cleaned[firstBracket]
    const endChar = startChar === '[' ? ']' : '}'
    let depth = 0
    for (let i = firstBracket; i < cleaned.length; i++) {
      if (cleaned[i] === startChar) depth++
      else if (cleaned[i] === endChar) depth--
      if (depth === 0) {
        try { return JSON.parse(cleaned.slice(firstBracket, i + 1)) } catch {}
        break
      }
    }
  }

  return null
}

const PRIMARY_MODEL = 'deepseek/deepseek-v4-pro'
const FALLBACK_MODEL = 'google/gemini-2.0-flash-001'
/** Large-context model for document/plan ingestion (long inputs) */
export const DOC_PLAN_MODEL = 'z-ai/glm-5.2'

export async function callAgentAI(params: {
  system: string
  user: string
  maxTokens?: number
  temperature?: number
  /** Override primary model (e.g. DOC_PLAN_MODEL for long documents) */
  model?: string
}): Promise<AgentAIResult> {
  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) throw new Error('OpenRouter API key not configured')

  const body = {
    messages: [
      { role: 'system', content: params.system },
      { role: 'user', content: params.user },
    ],
    temperature: params.temperature ?? 0.5,
    max_tokens: params.maxTokens ?? 4096,
  }

  const headers = {
    'Authorization': `Bearer ${openrouterApiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://focusflow.app',
    'X-Title': 'FocusFlow',
  }

  const primary = params.model || PRIMARY_MODEL
  let response: any
  let usedModel = primary
  try {
    response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers, body: { model: primary, ...body },
    })
  } catch (primaryError: any) {
    console.error(`[agentAI] ${primary} failed:`, primaryError.data?.error || primaryError.message)
    usedModel = FALLBACK_MODEL
    response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers, body: { model: FALLBACK_MODEL, ...body },
    })
  }

  const content = response.choices?.[0]?.message?.content || ''
  if (!content) throw new Error('AI returned empty response')

  return { content: stripAgentThinkTags(content), model: usedModel, usage: response.usage }
}
