import { serverSupabaseServiceRole } from '#supabase/server'
import { AGENT_REGISTRY, VALID_AGENT_TYPES, DOC_PLAN_MODEL, agentRegistryPrompt, buildMemberRoster, rosterPrompt, callAgentAI, extractAgentJSON } from '~~/server/utils/agentAI'
import { recordTokenUsage, isTokenLimitExceeded } from '~~/server/utils/tokens'
import { storeMemory } from '~~/server/utils/embeddings'

/**
 * Multi-agent deliberation:
 *  1. The orchestrator convenes a panel of relevant specialist agents.
 *  2. Each panelist analyzes the goal from its specialty (parallel).
 *  3. The orchestrator synthesizes the debate into a plan whose tasks are
 *     EXTENSIVELY documented (context, scope, steps, acceptance criteria,
 *     dependencies, panel notes) and creates them on the board.
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const projectId = String(body.project_id || '')
  const goal = String(body.goal || '').trim()
  const document = String(body.document || '').trim()
  const maxTasks = Math.min(Number(body.max_tasks) || 8, 12)

  if (!projectId) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (goal.length < 10) throw createError({ statusCode: 400, message: 'goal is too short' })

  const supabase = serverSupabaseServiceRole(event)

  const { data: project } = await supabase
    .from('projects').select('id, name, description').eq('id', projectId).eq('workspace_id', workspaceId).maybeSingle()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  const { data: columns } = await supabase
    .from('kanban_columns').select('id, title, position').eq('project_id', projectId).order('position')
  if (!columns?.length) throw createError({ statusCode: 422, message: 'Project has no columns' })

  if (await isTokenLimitExceeded({ supabase, workspaceId })) {
    throw createError({ statusCode: 429, message: 'Token limit exceeded for this workspace' })
  }

  const roster = await buildMemberRoster(supabase, workspaceId)
  const { data: existingTasks } = await supabase
    .from('tasks').select('title').eq('project_id', projectId).is('parent_task_id', null).limit(40)
  const existingTitles = (existingTasks || []).map((t: any) => `- ${t.title}`).join('\n') || '(tablero vacío)'

  const track = (action: string) => (res: { model: string; usage?: any }) => {
    if (res.usage) recordTokenUsage({ supabase, userId: user.id, workspaceId, action, model: res.model, usage: res.usage }).catch(() => {})
    return res
  }

  const docSnippet = document ? `\n\nDocumentación adjunta:\n${document.slice(0, 60_000)}` : ''

  // ── Round 1: the orchestrator convenes the panel ──
  const r1 = track('orchestrator_panel')(await callAgentAI({
    system: `Eres el ORCHESTRATOR de FocusFlow. Convocas al panel de especialistas adecuado para un objetivo.
Agentes disponibles:
${agentRegistryPrompt()}
Responde SOLO JSON: {"panel":[{"agent":"tipo","reason":"por qué es relevante"}]}
Entre 3 y 5 agentes, los más relevantes para el objetivo.`,
    user: `Objetivo del proyecto "${project.name}": ${goal.slice(0, 4000)}${document ? '\n(Hay documentación adjunta de ' + Math.round(document.length / 1000) + 'k caracteres)' : ''}`,
    maxTokens: 1536,
    temperature: 0.3,
  }))
  const panelParsed = extractAgentJSON(r1.content)
  const panel: Array<{ agent: string; reason: string }> = (panelParsed?.panel || [])
    .filter((p: any) => VALID_AGENT_TYPES.includes(p.agent) && p.agent !== 'orchestrator')
    .slice(0, 5)
  if (panel.length < 2) throw createError({ statusCode: 422, message: 'The orchestrator could not convene a panel — try a more specific goal' })

  // ── Round 2: each panelist analyzes the goal from its specialty (parallel) ──
  const perspectives = await Promise.all(panel.map(async (member) => {
    const info = AGENT_REGISTRY.find(a => a.type === member.agent)!
    try {
      const res = track(`orchestrator_debate_${member.agent}`)(await callAgentAI({
        system: `Eres el agente ${info.name.toUpperCase()} en una mesa de planificación. Tu especialidad: ${info.specialty}.
Analiza el objetivo SOLO desde tu especialidad. Sé concreto y técnico, y señala lo que otros roles podrían pasar por alto.
Responde SOLO JSON: {"perspective":"tu análisis en 3-5 frases","proposals":["propuesta concreta"],"risks":["riesgo o dependencia"],"suggested_tasks":[{"title":"...","notes":"detalles clave para documentar la tarea"}]}
Máximo 4 propuestas, 3 riesgos y 4 tareas sugeridas.`,
        user: `Proyecto: "${project.name}" — ${String(project.description || '').slice(0, 400)}\nObjetivo: ${goal.slice(0, 4000)}${docSnippet.slice(0, 30_000)}\nTareas existentes:\n${existingTitles}`,
        maxTokens: 3072,
        temperature: 0.6,
      }))
      const parsed = extractAgentJSON(res.content)
      return {
        agent: member.agent,
        name: info.name,
        reason: member.reason,
        perspective: String(parsed?.perspective || res.content.slice(0, 400)),
        proposals: Array.isArray(parsed?.proposals) ? parsed.proposals.slice(0, 4) : [],
        risks: Array.isArray(parsed?.risks) ? parsed.risks.slice(0, 3) : [],
        suggested_tasks: Array.isArray(parsed?.suggested_tasks) ? parsed.suggested_tasks.slice(0, 4) : [],
      }
    } catch (e: any) {
      return { agent: member.agent, name: info.name, reason: member.reason, perspective: `(no disponible: ${e.message})`, proposals: [], risks: [], suggested_tasks: [] }
    }
  }))

  // ── Round 3: the orchestrator synthesizes the debate into an extensively documented plan ──
  const debateText = perspectives.map(p =>
    `### ${p.name} (${p.agent})\nAnálisis: ${p.perspective}\nPropuestas: ${p.proposals.join(' | ') || '-'}\nRiesgos: ${p.risks.join(' | ') || '-'}\nTareas sugeridas: ${p.suggested_tasks.map((t: any) => t.title).join(' | ') || '-'}`
  ).join('\n\n')

  const r3 = track('orchestrator_synthesis')(await callAgentAI({
    system: `Eres el ORCHESTRATOR de FocusFlow. El panel ya deliberó — ahora sintetiza el debate en UN plan coherente.
Resuelve conflictos entre agentes, elimina duplicados y ordena por dependencia.
Miembros humanos (assignee_id exacto):
${rosterPrompt(roster)}
Cada tarea DEBE tener una descripción EXTENSA en markdown con estas secciones:
## Contexto (por qué existe esta tarea, qué dijo el panel)
## Alcance (qué incluye y qué NO incluye)
## Pasos de implementación (lista numerada, específica)
## Criterios de aceptación (checklist verificable)
## Dependencias (de otras tareas del plan o externas)
Responde SOLO JSON:
{"summary":"resumen ejecutivo del plan en 3-5 frases","decisions":[{"topic":"tema debatido","decision":"qué se decidió","rationale":"por qué, citando a los agentes"}],"tasks":[{"title":"...","description":"markdown extenso con TODAS las secciones","priority":"low|medium|high|critical","estimated_hours":N,"ai_agent":"tipo del panel o null","assignee_id":"uuid o null","tags":["..."]}]}
Máximo ${maxTasks} tareas y 6 decisiones. Idioma del objetivo.`,
    user: `Objetivo: ${goal.slice(0, 4000)}\n\nDebate del panel:\n${debateText}${document ? docSnippet.slice(0, 40_000) : ''}\n\nTareas existentes (no duplicar):\n${existingTitles}`,
    model: document ? DOC_PLAN_MODEL : undefined,
    maxTokens: 16384,
    temperature: 0.4,
  }))
  const plan = extractAgentJSON(r3.content)
  if (!plan?.tasks?.length) throw createError({ statusCode: 422, message: 'The synthesis produced no tasks — try again or refine the goal' })

  // ── Create the extensively documented tasks ──
  const targetColumn = columns[0]!
  const { data: maxPos } = await supabase
    .from('tasks').select('position').eq('column_id', targetColumn.id).order('position', { ascending: false }).limit(1)
  let position = maxPos?.[0]?.position != null ? maxPos[0].position + 1 : 0

  const validAssignees = new Set(roster.map(m => m.id))
  const panelAgents = new Set(panel.map(p => p.agent))
  const inserts = plan.tasks.slice(0, maxTasks).map((t: any) => ({
    project_id: projectId,
    column_id: targetColumn.id,
    title: String(t.title || 'Tarea').slice(0, 500),
    description: t.description ? String(t.description).slice(0, 10000) : null,
    priority: ['low', 'medium', 'high', 'critical'].includes(t.priority) ? t.priority : 'medium',
    estimated_hours: typeof t.estimated_hours === 'number' && t.estimated_hours > 0 ? Math.min(t.estimated_hours, 500) : null,
    assignees: t.assignee_id && validAssignees.has(t.assignee_id) ? [t.assignee_id] : [],
    tags: Array.isArray(t.tags) ? t.tags.slice(0, 8).map((s: any) => String(s).slice(0, 40)) : [],
    ai_agent: t.ai_agent && panelAgents.has(t.ai_agent) ? t.ai_agent : (t.ai_agent && VALID_AGENT_TYPES.includes(t.ai_agent) ? t.ai_agent : null),
    reporter_id: user.id,
    position: position++,
  }))

  const { data: created, error } = await supabase.from('tasks').insert(inserts).select('id, title, priority, ai_agent, estimated_hours, tags')
  if (error) throw createError({ statusCode: 500, message: `Failed to create tasks: ${error.message}` })

  const decisions = Array.isArray(plan.decisions) ? plan.decisions.slice(0, 6) : []

  // Persist the run + searchable memory of the decisions (fire-and-forget)
  supabase.from('ai_orchestrator_runs').insert({
    workspace_id: workspaceId,
    project_id: projectId,
    triggered_by: user.id,
    prompt: `deliberate: ${goal.slice(0, 200)}`,
    agent_type: 'orchestrator',
    status: 'completed',
    result: { panel, decisions, summary: plan.summary, tasks_created: (created || []).length },
    tasks_created: (created || []).map((t: any) => t.id),
    completed_at: new Date().toISOString(),
  }).then(() => {}, () => {})

  storeMemory({
    supabase,
    workspaceId,
    contentText: `Deliberación del panel (${panel.map(p => p.agent).join(', ')}) sobre: ${goal.slice(0, 300)}. Resumen: ${plan.summary || ''}. Decisiones: ${decisions.map((d: any) => `${d.topic}: ${d.decision}`).join(' | ')}`,
    agentType: 'orchestrator',
    contentType: 'deliberation',
    projectId,
    metadata: { panel: panel.map(p => p.agent) },
    createdBy: user.id,
  }).catch(() => {})

  return {
    summary: plan.summary || '',
    panel,
    discussion: perspectives,
    decisions,
    column: targetColumn.title,
    tasks_created: (created || []).length,
    tasks: created || [],
  }
})
