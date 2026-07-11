import { serverSupabaseServiceRole } from '#supabase/server'
import { DOC_PLAN_MODEL, VALID_AGENT_TYPES, agentRegistryPrompt, buildMemberRoster, rosterPrompt, callAgentAI, extractAgentJSON } from '~~/server/utils/agentAI'
import { recordTokenUsage, isTokenLimitExceeded } from '~~/server/utils/tokens'

/**
 * Plan from document: paste detailed documentation / a project plan and the
 * planner agent (GLM-5.2, large context) decomposes it into tasks, assigning
 * each one to the best AI agent and/or member by specialty.
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const projectId = body.project_id as string
  const document = String(body.document || '').trim()
  const maxTasks = Math.min(Number(body.max_tasks) || 15, 30)

  if (!projectId) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (document.length < 30) throw createError({ statusCode: 400, message: 'document is too short — paste the plan or documentation to analyze' })

  const supabase = serverSupabaseServiceRole(event)

  // Verify project + get target column
  const { data: project } = await supabase
    .from('projects').select('id, name').eq('id', projectId).eq('workspace_id', workspaceId).maybeSingle()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  const { data: columns } = await supabase
    .from('kanban_columns').select('id, title, position').eq('project_id', projectId).order('position')
  if (!columns?.length) throw createError({ statusCode: 422, message: 'Project has no columns' })
  const targetColumn = body.column_id
    ? columns.find((c: any) => c.id === body.column_id)
    : columns[0]
  if (!targetColumn) throw createError({ statusCode: 404, message: 'Column not found in this project' })

  // Token budget
  if (await isTokenLimitExceeded({ supabase, workspaceId })) {
    throw createError({ statusCode: 429, message: 'Token limit exceeded for this workspace' })
  }

  const roster = await buildMemberRoster(supabase, workspaceId)

  // Existing board context: on repeated document uploads the planner must
  // create the MISSING work, never return an empty plan nor exact duplicates.
  const { data: existingTasks } = await supabase
    .from('tasks').select('title').eq('project_id', projectId).is('parent_task_id', null).limit(60)
  const existingTitles = (existingTasks || []).map((t: any) => `- ${t.title}`).join('\n') || '(tablero vacío)'

  const system = `Eres el agente PLANNER de FocusFlow. Recibes documentación o un plan detallado y lo conviertes en tareas concretas, accionables y bien asignadas.
Tareas que YA existen en el tablero (no las repitas literalmente — genera el trabajo que FALTA, o desglósalo más fino, o cubre nuevos aspectos del documento):
${existingTitles}
Agentes AI disponibles (campo ai_agent):
${agentRegistryPrompt()}
Miembros humanos (campo assignee_id, usa el id exacto):
${rosterPrompt(roster)}
Responde SOLO JSON:
{"summary":"resumen del plan en 2-3 frases","tasks":[{"title":"...","description":"markdown con contexto y criterios de aceptación","priority":"low|medium|high|critical","estimated_hours":N,"ai_agent":"tipo o null","assignee_id":"uuid o null","tags":["..."]}]}
Máximo ${maxTasks} tareas, ordenadas por dependencia lógica. Asigna cada tarea al agente y/o miembro cuya especialidad encaje mejor. Usa el idioma del documento. NUNCA devuelvas "tasks" vacío: si el documento ya está cubierto, genera tareas de siguiente nivel (QA, lanzamiento, mejoras, métricas).`

  // GLM-5.2 handles long inputs — cap defensively at ~180k chars
  const docText = document.slice(0, 180_000)
  const ai = await callAgentAI({
    system,
    user: `Documento a planificar (proyecto "${project.name}"):\n\n${docText}`,
    model: DOC_PLAN_MODEL,
    maxTokens: 16384,
    temperature: 0.4,
  })

  if (ai.usage) {
    recordTokenUsage({ supabase, userId: user.id, workspaceId, action: 'plan_from_doc', model: ai.model, usage: ai.usage }).catch(() => {})
  }

  const parsed = extractAgentJSON(ai.content)
  if (!parsed?.tasks?.length) {
    throw createError({ statusCode: 422, message: 'The planner could not extract tasks from this document — try adding more detail' })
  }

  // Append after existing tasks in the target column
  const { data: maxPos } = await supabase
    .from('tasks').select('position').eq('column_id', targetColumn.id).order('position', { ascending: false }).limit(1)
  let position = maxPos?.[0]?.position != null ? maxPos[0].position + 1 : 0

  const validAssignees = new Set(roster.map(m => m.id))
  const inserts = parsed.tasks.slice(0, maxTasks).map((t: any) => ({
    project_id: projectId,
    column_id: targetColumn.id,
    title: String(t.title || 'Tarea').slice(0, 500),
    description: t.description ? String(t.description).slice(0, 10000) : null,
    priority: ['low', 'medium', 'high', 'critical'].includes(t.priority) ? t.priority : 'medium',
    estimated_hours: typeof t.estimated_hours === 'number' && t.estimated_hours > 0 ? Math.min(t.estimated_hours, 500) : null,
    assignees: t.assignee_id && validAssignees.has(t.assignee_id) ? [t.assignee_id] : [],
    tags: Array.isArray(t.tags) ? t.tags.slice(0, 8).map((s: any) => String(s).slice(0, 40)) : [],
    ai_agent: t.ai_agent && VALID_AGENT_TYPES.includes(t.ai_agent) ? t.ai_agent : null,
    reporter_id: user.id,
    position: position++,
  }))

  const { data: created, error } = await supabase.from('tasks').insert(inserts).select('id, title, priority, ai_agent, assignees, estimated_hours, tags')
  if (error) throw createError({ statusCode: 500, message: `Failed to create tasks: ${error.message}` })

  supabase.from('ai_orchestrator_runs').insert({
    workspace_id: workspaceId,
    project_id: projectId,
    triggered_by: user.id,
    prompt: `plan_from_doc: ${docText.slice(0, 200)}...`,
    agent_type: 'planner',
    status: 'completed',
    result: { tasks_created: (created || []).length, model: ai.model, summary: parsed.summary },
    tasks_created: (created || []).map((t: any) => t.id),
    completed_at: new Date().toISOString(),
  }).then(() => {}, () => {})

  return {
    summary: parsed.summary || '',
    model: ai.model,
    project: project.name,
    column: targetColumn.title,
    tasks_created: (created || []).length,
    tasks: created || [],
  }
})
