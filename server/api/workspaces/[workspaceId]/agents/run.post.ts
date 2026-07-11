import { serverSupabaseServiceRole } from '#supabase/server'
import { AGENT_REGISTRY, VALID_AGENT_TYPES, callAgentAI, extractAgentJSON } from '~~/server/utils/agentAI'
import { recordTokenUsage, isTokenLimitExceeded } from '~~/server/utils/tokens'

/**
 * Run a specialist agent with a brief: the agent analyzes the request from its
 * specialty's perspective, returns recommendations and creates concrete tasks
 * on the project board delegated to itself.
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const projectId = String(body.project_id || '')
  const agentType = String(body.agent_type || '')
  const brief = String(body.brief || '').trim()
  const createTasks = body.create_tasks !== false
  const maxTasks = Math.min(Number(body.max_tasks) || 5, 10)

  if (!projectId) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (!VALID_AGENT_TYPES.includes(agentType)) throw createError({ statusCode: 400, message: `Invalid agent_type. Valid: ${VALID_AGENT_TYPES.join(', ')}` })
  if (brief.length < 10) throw createError({ statusCode: 400, message: 'brief is too short — describe what you need from this agent' })

  const agent = AGENT_REGISTRY.find(a => a.type === agentType)!
  const supabase = serverSupabaseServiceRole(event)

  const { data: project } = await supabase
    .from('projects').select('id, name, description').eq('id', projectId).eq('workspace_id', workspaceId).maybeSingle()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  if (await isTokenLimitExceeded({ supabase, workspaceId })) {
    throw createError({ statusCode: 429, message: 'Token limit exceeded for this workspace' })
  }

  // Board context: existing task titles help the agent avoid duplicates
  const { data: columns } = await supabase
    .from('kanban_columns').select('id, title, position').eq('project_id', projectId).order('position')
  if (!columns?.length) throw createError({ statusCode: 422, message: 'Project has no columns' })
  const { data: existingTasks } = await supabase
    .from('tasks').select('title').eq('project_id', projectId).is('parent_task_id', null).limit(40)
  const existingTitles = (existingTasks || []).map((t: any) => `- ${t.title}`).join('\n') || '(tablero vacío)'

  const system = `Eres el agente ${agent.name.toUpperCase()} de FocusFlow. Tu especialidad: ${agent.specialty}.
Analiza el brief SOLO desde tu especialidad y produce trabajo accionable.
Contexto del proyecto "${project.name}": ${String(project.description || '').slice(0, 500)}
Tareas ya existentes (NO las dupliques):
${existingTitles}
Responde SOLO JSON:
{"summary":"tu análisis en 2-4 frases","recommendations":["recomendación concreta", "..."],"tasks":[{"title":"...","description":"markdown con contexto y criterios de aceptación","priority":"low|medium|high|critical","estimated_hours":N,"tags":["..."]}]}
Máximo ${maxTasks} tareas y 5 recomendaciones. Idioma del brief.`

  const ai = await callAgentAI({ system, user: `Brief: ${brief.slice(0, 8000)}`, maxTokens: 6144, temperature: 0.5 })

  if (ai.usage) {
    recordTokenUsage({ supabase, userId: user.id, workspaceId, action: `agent_run_${agentType}`, model: ai.model, usage: ai.usage }).catch(() => {})
  }

  const parsed = extractAgentJSON(ai.content)
  if (!parsed?.summary) throw createError({ statusCode: 422, message: 'The agent returned an invalid response — try a more specific brief' })

  // Create tasks in the first column, delegated to this agent
  let created: any[] = []
  if (createTasks && Array.isArray(parsed.tasks) && parsed.tasks.length) {
    const targetColumn = columns[0]!
    const { data: maxPos } = await supabase
      .from('tasks').select('position').eq('column_id', targetColumn.id).order('position', { ascending: false }).limit(1)
    let position = maxPos?.[0]?.position != null ? maxPos[0].position + 1 : 0

    const inserts = parsed.tasks.slice(0, maxTasks).map((t: any) => ({
      project_id: projectId,
      column_id: targetColumn.id,
      title: String(t.title || 'Tarea').slice(0, 500),
      description: t.description ? String(t.description).slice(0, 10000) : null,
      priority: ['low', 'medium', 'high', 'critical'].includes(t.priority) ? t.priority : 'medium',
      estimated_hours: typeof t.estimated_hours === 'number' && t.estimated_hours > 0 ? Math.min(t.estimated_hours, 500) : null,
      assignees: [],
      tags: Array.isArray(t.tags) ? t.tags.slice(0, 8).map((s: any) => String(s).slice(0, 40)) : [],
      ai_agent: agentType,
      reporter_id: user.id,
      position: position++,
    }))

    const { data, error } = await supabase.from('tasks').insert(inserts).select('id, title, priority, estimated_hours, tags')
    if (error) throw createError({ statusCode: 500, message: `Failed to create tasks: ${error.message}` })
    created = data || []
  }

  supabase.from('ai_orchestrator_runs').insert({
    workspace_id: workspaceId,
    project_id: projectId,
    triggered_by: user.id,
    prompt: `agent_run ${agentType}: ${brief.slice(0, 200)}`,
    agent_type: agentType,
    status: 'completed',
    result: { tasks_created: created.length, model: ai.model, summary: parsed.summary },
    tasks_created: created.map((t: any) => t.id),
    completed_at: new Date().toISOString(),
  }).then(() => {}, () => {})

  return {
    agent: agentType,
    agent_name: agent.name,
    summary: parsed.summary,
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
    tasks_created: created.length,
    tasks: created,
    model: ai.model,
  }
})
