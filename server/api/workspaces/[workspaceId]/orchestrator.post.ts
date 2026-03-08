import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * AI Orchestrator — Decomposes a task or prompt into subtasks
 * and delegates them to specialized AI agents.
 *
 * POST /api/workspaces/:workspaceId/orchestrator
 * Body: { task_id?, prompt?, project_id, auto_delegate?: boolean }
 */

const AGENT_TYPES = ['backend', 'frontend', 'qa', 'devops', 'designer', 'copywriter', 'data', 'security'] as const

interface DecomposedTask {
  title: string
  description: string
  priority: string
  ai_agent: string
  tags: string[]
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const { task_id, prompt, project_id, auto_delegate = true } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (!task_id && !prompt) throw createError({ statusCode: 400, message: 'Either task_id or prompt is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Verify project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, kanban_template')
    .eq('id', project_id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  // Get source task if provided
  let sourceTask: any = null
  if (task_id) {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, description, priority, tags, column_id, project_id')
      .eq('id', task_id)
      .eq('project_id', project_id)
      .maybeSingle()

    if (!data) throw createError({ statusCode: 404, message: 'Task not found in this project' })
    sourceTask = data
  }

  // Get columns for the project
  const { data: columns } = await supabase
    .from('kanban_columns')
    .select('id, title, position')
    .eq('project_id', project_id)
    .order('position')

  const firstColumnId = columns?.[0]?.id
  if (!firstColumnId) throw createError({ statusCode: 400, message: 'Project has no kanban columns' })

  // Create orchestrator run
  const orchestratorPrompt = sourceTask
    ? `Decompose task: "${sourceTask.title}". ${sourceTask.description || ''}`
    : prompt

  const { data: run } = await supabase
    .from('ai_orchestrator_runs')
    .insert({
      workspace_id: workspaceId,
      project_id,
      triggered_by: user.id,
      source_task_id: task_id || null,
      prompt: orchestratorPrompt,
      agent_type: 'orchestrator',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  try {
    // Call AI to decompose the task
    const decomposed = await decomposeWithAI(event, orchestratorPrompt, project.name)

    if (!decomposed || decomposed.length === 0) {
      await supabase.from('ai_orchestrator_runs').update({
        status: 'completed',
        result: { message: 'No subtasks generated', tasks_created: 0 },
        completed_at: new Date().toISOString(),
      }).eq('id', run.id)

      return { run_id: run.id, tasks_created: 0, tasks: [] }
    }

    // Create the subtasks
    const targetColumnId = sourceTask?.column_id || firstColumnId
    const createdTasks: any[] = []

    for (let i = 0; i < Math.min(decomposed.length, 20); i++) {
      const dt = decomposed[i]
      const insertPayload: Record<string, any> = {
        project_id,
        column_id: targetColumnId,
        title: dt.title.slice(0, 500),
        description: (dt.description || '').slice(0, 10000),
        priority: dt.priority || 'medium',
        assignees: [],
        tags: dt.tags || [],
        reporter_id: user.id,
        position: i,
      }

      if (auto_delegate && dt.ai_agent && AGENT_TYPES.includes(dt.ai_agent as any)) {
        insertPayload.ai_agent = dt.ai_agent
      }

      if (sourceTask) {
        insertPayload.parent_task_id = sourceTask.id
      }

      const { data: task } = await supabase.from('tasks').insert(insertPayload).select().single()
      if (task) createdTasks.push(task)
    }

    // Mark source task as decomposed
    if (sourceTask) {
      await supabase.from('tasks').update({
        ai_decomposed: true,
        ai_agent: 'orchestrator',
        updated_at: new Date().toISOString(),
      }).eq('id', sourceTask.id)
    }

    // Update run
    await supabase.from('ai_orchestrator_runs').update({
      status: 'completed',
      result: {
        tasks_created: createdTasks.length,
        agents_used: [...new Set(decomposed.map((d: DecomposedTask) => d.ai_agent).filter(Boolean))],
      },
      tasks_created: createdTasks.map((t: any) => t.id),
      completed_at: new Date().toISOString(),
    }).eq('id', run.id)

    return {
      run_id: run.id,
      tasks_created: createdTasks.length,
      agents_used: [...new Set(decomposed.map((d: DecomposedTask) => d.ai_agent).filter(Boolean))],
      tasks: createdTasks,
    }
  } catch (e: any) {
    await supabase.from('ai_orchestrator_runs').update({
      status: 'failed',
      error: e.message,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id)

    throw createError({ statusCode: 500, message: `Orchestrator failed: ${e.message}` })
  }
})

/**
 * Call AI to decompose a task/prompt into subtasks with agent assignments
 */
async function decomposeWithAI(event: any, prompt: string, projectName: string): Promise<DecomposedTask[]> {
  const config = useRuntimeConfig()
  const apiKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    // Fallback: return a simple decomposition without AI
    return fallbackDecompose(prompt)
  }

  const systemPrompt = `You are a project orchestrator AI. Given a task or prompt, decompose it into concrete subtasks and assign each to the most appropriate AI agent.

Available agents:
- backend: Server-side code, APIs, databases, auth, performance
- frontend: UI components, pages, styling, UX, responsive design
- qa: Testing, test plans, bug verification, quality assurance
- devops: CI/CD, deployment, infrastructure, monitoring, Docker
- designer: UI/UX design, mockups, design systems, accessibility
- copywriter: Content, documentation, copy, translations
- data: Data analysis, reports, dashboards, analytics
- security: Security audits, vulnerability checks, auth hardening

Rules:
- Create 3-10 focused, actionable subtasks
- Each subtask should be completable independently
- Assign the most relevant ai_agent to each
- Set priority: high for blocking tasks, medium for standard, low for nice-to-have
- Add relevant tags
- Keep titles concise (under 80 chars)
- Descriptions should have clear acceptance criteria

Respond ONLY with a JSON array (no markdown, no explanation):
[{"title":"...","description":"...","priority":"medium","ai_agent":"backend","tags":["api","auth"]}]`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://focusflow.app',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Project: ${projectName}\n\nTask to decompose:\n${prompt}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    const data = await response.json() as any
    let content = data?.choices?.[0]?.message?.content || ''

    // Strip think tags if present
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    // Extract JSON array
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) return fallbackDecompose(prompt)

    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return fallbackDecompose(prompt)

    return parsed.filter((t: any) => t.title).map((t: any) => ({
      title: String(t.title),
      description: String(t.description || ''),
      priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium',
      ai_agent: AGENT_TYPES.includes(t.ai_agent) ? t.ai_agent : 'backend',
      tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
    }))
  } catch {
    return fallbackDecompose(prompt)
  }
}

/**
 * Simple fallback decomposition without AI
 */
function fallbackDecompose(prompt: string): DecomposedTask[] {
  return [
    { title: `Analyze requirements: ${prompt.slice(0, 60)}`, description: `Review and document requirements for: ${prompt}`, priority: 'high', ai_agent: 'backend', tags: ['analysis'] },
    { title: `Implement core logic`, description: `Build the main functionality described in: ${prompt}`, priority: 'high', ai_agent: 'backend', tags: ['implementation'] },
    { title: `Create UI components`, description: `Design and build frontend components for: ${prompt}`, priority: 'medium', ai_agent: 'frontend', tags: ['ui'] },
    { title: `Write tests`, description: `Create unit and integration tests for the implementation`, priority: 'medium', ai_agent: 'qa', tags: ['testing'] },
    { title: `Documentation`, description: `Document the implementation, API endpoints, and usage`, priority: 'low', ai_agent: 'copywriter', tags: ['docs'] },
  ]
}
