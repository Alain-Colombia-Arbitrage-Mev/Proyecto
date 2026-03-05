import { serverSupabaseServiceRole } from '#supabase/server'
import { generateTaskDocs } from '~~/server/utils/taskDocGenerator'

const MAX_MESSAGE_LENGTH = 100_000
const MAX_HISTORY_MESSAGES = 50
const MAX_HISTORY_MSG_LENGTH = 10_000

/** Strip <think>...</think> blocks that Qwen3 and other reasoning models produce */
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

/** Extract JSON from AI response — handles markdown wrapping, think tags, and extra text */
function extractJSON(text: string): any | null {
  // Strip reasoning/think tags first
  const cleaned = stripThinkTags(text)

  // 1. Try direct parse
  try { return JSON.parse(cleaned.trim()) } catch {}

  // 2. Extract from ```json ... ``` block
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonBlockMatch?.[1]) {
    try { return JSON.parse(jsonBlockMatch[1].trim()) } catch {}
  }

  // 3. Find first [ or { and extract to matching ] or }
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

/**
 * Resolve workspaceId from a projectId by querying the DB.
 * Returns the workspace_id or throws 404.
 */
async function getWorkspaceIdFromProject(supabase: any, projectId: string): Promise<string> {
  const { data: project } = await supabase
    .from('projects')
    .select('workspace_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  return project.workspace_id
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey) throw createError({ statusCode: 500, message: 'OpenRouter API key not configured' })

  const body = await readBody(event)
  const { action, context } = body

  if (!action) throw createError({ statusCode: 400, message: 'Action is required' })
  if (!context) throw createError({ statusCode: 400, message: 'Context is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Resolve workspaceId for token tracking — accept from context as global fallback
  let resolvedWorkspaceId: string | null = null
  if (context.workspaceId && typeof context.workspaceId === 'string') {
    resolvedWorkspaceId = context.workspaceId
  }

  let systemPrompt = ''
  let userPrompt = ''

  switch (action) {
    case 'suggest_tasks': {
      if (!context.projectName || typeof context.projectName !== 'string') {
        throw createError({ statusCode: 400, message: 'projectName is required' })
      }
      systemPrompt = `PM experto. Genera 5 tareas JSON array. Cada: {title,description,priority:"low"|"medium"|"high"|"critical",tags:[],estimated_hours:N}. ES. Empieza por las más pequeñas. Solo JSON.`
      userPrompt = `${String(context.projectName).slice(0, 2000)}|${String(context.projectDescription || '').slice(0, 3000)}`
      if (context.workspaceId) {
        resolvedWorkspaceId = String(context.workspaceId)
        await requirePermission(event, resolvedWorkspaceId, 'use_ai_basic')
      }
      break
    }

    case 'break_down_task': {
      if (!context.taskTitle || typeof context.taskTitle !== 'string') {
        throw createError({ statusCode: 400, message: 'taskTitle is required' })
      }
      systemPrompt = `Descompón en 3-6 subtareas. JSON array: [{title,estimated_minutes}]. ES. Solo JSON.`
      userPrompt = `${String(context.taskTitle).slice(0, 2000)}|${String(context.taskDescription || '').slice(0, 3000)}`
      if (context.workspaceId) {
        resolvedWorkspaceId = String(context.workspaceId)
        await requirePermission(event, resolvedWorkspaceId, 'use_ai_basic')
      }
      break
    }

    case 'improve_task': {
      if (!context.taskTitle || typeof context.taskTitle !== 'string') {
        throw createError({ statusCode: 400, message: 'taskTitle is required' })
      }
      systemPrompt = `Mejora esta tarea. JSON: {title,description,priority_suggestion:"low"|"medium"|"high"|"critical",estimated_hours:N,tags:[]}. Descripción con criterios de aceptación. ES. Solo JSON.`
      userPrompt = `${String(context.taskTitle).slice(0, 2000)}|${String(context.taskDescription || '').slice(0, 3000)}|p:${context.priority || 'medium'}`
      if (context.workspaceId) {
        resolvedWorkspaceId = String(context.workspaceId)
        await requirePermission(event, resolvedWorkspaceId, 'use_ai_basic')
      }
      break
    }

    case 'daily_plan': {
      if (!context.projectId || typeof context.projectId !== 'string') {
        throw createError({ statusCode: 400, message: 'projectId is required' })
      }
      // Verify workspace access via project
      const wsId = await getWorkspaceIdFromProject(supabase, context.projectId)
      await requirePermission(event, wsId, 'use_ai_basic')
      resolvedWorkspaceId = wsId

      const { data: tasks } = await supabase
        .from('tasks')
        .select('title, priority, due_date, estimated_hours, column_id, tags')
        .eq('project_id', context.projectId)
        .order('position')
        .limit(100)

      systemPrompt = `Coach anti-procrastinación. JSON: {greeting,focus_tasks:[3-5 títulos],pomodoro_suggestion,procrastination_tip,tip}. Empieza por la más fácil. ES. Solo JSON.`
      userPrompt = `Tareas:\n${JSON.stringify((tasks || []).map((t: any) => ({ t: t.title, p: t.priority, h: t.estimated_hours })))}`
      break
    }

    case 'document_architecture': {
      if (!context.projectId || typeof context.projectId !== 'string') {
        throw createError({ statusCode: 400, message: 'projectId is required' })
      }
      // Derive workspace from project and verify access
      const docWsId = await getWorkspaceIdFromProject(supabase, context.projectId)
      await requirePermission(event, docWsId, 'use_ai_basic')
      resolvedWorkspaceId = docWsId

      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, description, status, priority, kanban_template')
        .eq('workspace_id', docWsId)
        .limit(50)

      const projectIds = (projects || []).map((p: any) => p.id)

      const [{ data: columns }, { data: taskStats }] = await Promise.all([
        supabase
          .from('kanban_columns')
          .select('title, project_id, position')
          .in('project_id', projectIds.length ? projectIds : ['__none__']),
        supabase
          .from('tasks')
          .select('project_id, priority, column_id')
          .in('project_id', projectIds.length ? projectIds : ['__none__']),
      ])

      systemPrompt = `Arquitecto SW senior. Analiza workspace → doc arquitectura técnica ES.

JSON: {title,summary,sections:[{heading,content}],diagrams:[{type:"flow"|"structure"|"infrastructure"|"pipeline",description}],risks:[],recommendations:[]}

Secciones: 1.Visión General 2.Backend(APIs,auth,middlewares) 3.Modelo Datos(tablas,relaciones,migraciones) 4.DevOps&CI/CD(pipeline,deploy,Docker) 5.Infraestructura(hosting,DB,CDN,scaling) 6.Monitoreo(logging,métricas,alertas) 7.Seguridad(auth,RLS,CORS,OWASP) 8.Testing(unit,integration,e2e) 9.Flujo Trabajo(branching,review,release) 10.Recomendaciones

Específico, basado en datos reales. Solo JSON.`
      userPrompt = `${projects?.length || 0} proyectos|${columns?.length || 0} cols|${taskStats?.length || 0} tareas\n${JSON.stringify((projects || []).map((p: any) => ({ n: p.name, s: p.status, p: p.priority })))}`

      // Store metadata for post-processing after AI call
      ;(event.context as any)._docArchMeta = {
        workspaceId: docWsId,
        projectId: context.projectId,
        projectsSummary: userPrompt, // keep for second AI call
      }
      break
    }

    case 'anti_procrastination': {
      if (!context.projectId || typeof context.projectId !== 'string') {
        throw createError({ statusCode: 400, message: 'projectId is required' })
      }
      // Verify workspace access via project
      const apWsId = await getWorkspaceIdFromProject(supabase, context.projectId)
      await requirePermission(event, apWsId, 'use_ai_basic')
      resolvedWorkspaceId = apWsId

      const { data: tasks } = await supabase
        .from('tasks')
        .select('title, priority, due_date, estimated_hours, column_id, created_at')
        .eq('project_id', context.projectId)
        .order('created_at')
        .limit(100)

      systemPrompt = `Análisis anti-procrastinación. JSON: {score:1-100,analysis,quick_wins:[3 tareas <15min],blocked_tasks:[],techniques:[{name,description}],two_minute_rule:[],motivation}. ES. Solo JSON.`
      userPrompt = `"${String(context.projectName || '').slice(0, 500)}":\n${JSON.stringify((tasks || []).map((t: any) => ({ t: t.title, p: t.priority, h: t.estimated_hours, c: t.column_id })))}`
      break
    }

    case 'chat': {
      const message = String(context.message || '').slice(0, MAX_MESSAGE_LENGTH)
      if (!message) throw createError({ statusCode: 400, message: 'message is required' })

      // Resolve workspaceId from project or directly from context
      if (context.workspaceId && typeof context.workspaceId === 'string' && !resolvedWorkspaceId) {
        await requirePermission(event, context.workspaceId, 'use_ai_basic')
        resolvedWorkspaceId = context.workspaceId
      }

      // Build project context if available
      let projectContext = ''
      let chatWsId = ''
      if (context.projectId && typeof context.projectId === 'string') {
        chatWsId = await getWorkspaceIdFromProject(supabase, context.projectId)
        await requireWorkspaceMember(event, chatWsId)
        resolvedWorkspaceId = chatWsId

        const { data: chatTasks } = await supabase
          .from('tasks')
          .select('title, priority, column_id, tags, estimated_hours')
          .eq('project_id', context.projectId)
          .order('position')
          .limit(50)

        const { data: chatColumns } = await supabase
          .from('kanban_columns')
          .select('id, title')
          .eq('project_id', context.projectId)
          .order('position')

        const columnMap = Object.fromEntries((chatColumns || []).map((c: any) => [c.id, c.title]))
        const taskSummary = (chatTasks || []).map((t: any) => `- [${columnMap[t.column_id] || '?'}] ${t.title} (${t.priority})`).join('\n')

        projectContext = `\nProyecto:"${String(context.projectName || '').slice(0, 500)}"|Col:${(chatColumns || []).map((c: any) => c.title).join(',')}|Tareas:\n${taskSummary || 'ninguna'}`
      }

      // RAG: Search relevant memories from workspace
      let memoryContext = ''
      if (chatWsId) {
        try {
          const memories = await searchMemories({
            supabase,
            workspaceId: chatWsId,
            query: message,
            limit: 5,
            threshold: 0.65,
          })
          if (memories.length > 0) {
            const memoryLines = memories.map(m =>
              `- ${m.content_text.slice(0, 300)}`
            ).join('\n')
            memoryContext = `\nCtx:\n${memoryLines}`
          }
        } catch (memErr: any) {
          console.error('[chat] Memory search error:', memErr.message)
        }
      }

      // Build conversation history
      const history = Array.isArray(context.history) ? context.history.slice(-MAX_HISTORY_MESSAGES) : []
      const historyMessages = history
        .filter((h: any) => h.role && h.text && String(h.text).trim().length > 0)
        .map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: String(h.text).slice(0, MAX_HISTORY_MSG_LENGTH),
        }))

      systemPrompt = `Asistente PM FocusFlow.${projectContext}${memoryContext}

REGLAS:
1. Crear/sugerir/generar tareas → JSON array: [{title,title_en,description,description_en,priority,tags:[],estimated_hours}]. Description detallado: objetivo, pasos implementación, archivos, criterios aceptación ✅, notas técnicas. Bilingüe ES+EN. Solo JSON.
2. Otra consulta → texto plano ES, max 5 líneas.

No <think>. No markdown.`
      userPrompt = message

      // Inject history into the messages array for this call
      ;(event.context as any)._chatHistory = historyMessages
      // Store workspace ID for post-response memory auto-store
      ;(event.context as any)._chatMemoryMeta = { workspaceId: chatWsId, projectId: context.projectId, userId: user.id, userMessage: message }
      break
    }

    default: {
      // Check if this is a doc agent action
      if (isDocAgentAction(action)) {
        const docConfig = getDocAgentConfig(action)!
        if (!context.projectId || typeof context.projectId !== 'string') {
          throw createError({ statusCode: 400, message: 'projectId is required' })
        }

        const docAgentWsId = await getWorkspaceIdFromProject(supabase, context.projectId)
        await requirePermission(event, docAgentWsId, 'use_ai_doc_agents')
        resolvedWorkspaceId = docAgentWsId

        // Gather workspace data
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, description, status, priority, kanban_template')
          .eq('workspace_id', docAgentWsId)
          .limit(50)

        const projectIds = (projects || []).map((p: any) => p.id)
        const [{ data: columns }, { data: taskStats }] = await Promise.all([
          supabase
            .from('kanban_columns')
            .select('title, project_id, position')
            .in('project_id', projectIds.length ? projectIds : ['__none__']),
          supabase
            .from('tasks')
            .select('project_id, priority, column_id')
            .in('project_id', projectIds.length ? projectIds : ['__none__']),
        ])

        // For frontend_design agent: fetch library docs via Context7
        let libraryDocs = ''
        if (action === 'doc_frontend_design') {
          const libraries = ['vue', 'nuxt', 'tailwindcss', 'pinia']
          const docResults = await Promise.allSettled(
            libraries.map(lib => getLibraryDocumentation(lib))
          )
          const docs = docResults
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
            .map(r => r.value)
          if (docs.length > 0) {
            libraryDocs = docs.join('\n\n')
          }
        }

        const sessionId = createSessionId()
        systemPrompt = buildDocAgentSystemPrompt(docConfig, libraryDocs || undefined)
        userPrompt = `SID:${sessionId}|${projects?.length || 0}proj|${columns?.length || 0}cols|${taskStats?.length || 0}tasks\n${JSON.stringify((projects || []).map((p: any) => ({ n: p.name, s: p.status })))}`

        // Store metadata for post-processing
        ;(event.context as any)._docAgentMeta = {
          config: docConfig,
          sessionId,
          workspaceId: docAgentWsId,
          projectId: context.projectId,
        }
        break
      }

      // Check if this is a task management agent action
      if (isTaskAgentAction(action)) {
        const taskAgentConfig = getTaskAgentConfig(action)!
        if (!context.projectId || typeof context.projectId !== 'string') {
          throw createError({ statusCode: 400, message: 'projectId is required' })
        }

        const taWsId = await getWorkspaceIdFromProject(supabase, context.projectId)
        await requirePermission(event, taWsId, 'use_ai_basic')
        resolvedWorkspaceId = taWsId

        // Gather detailed project data (tasks with full info)
        const [{ data: tasksFull }, { data: columnsFull }, { data: members }] = await Promise.all([
          supabase
            .from('tasks')
            .select('id, title, description, priority, column_id, tags, estimated_hours, assignees, due_date, created_at, updated_at')
            .eq('project_id', context.projectId)
            .order('position')
            .limit(200),
          supabase
            .from('kanban_columns')
            .select('id, title, position, wip_limit')
            .eq('project_id', context.projectId)
            .order('position'),
          supabase
            .from('workspace_members')
            .select('user_id, role')
            .eq('workspace_id', taWsId),
        ])

        const { data: proj } = await supabase
          .from('projects')
          .select('name, description')
          .eq('id', context.projectId)
          .maybeSingle()

        const columnMap = Object.fromEntries((columnsFull || []).map((c: any) => [c.id, c.title]))
        const projectContext = `"${proj?.name || ''}"|${proj?.description?.slice(0, 300) || ''}|Cols:${(columnsFull || []).map((c: any) => c.title).join(',')}|${(members || []).length}mbrs|${(tasksFull || []).length}tasks
${JSON.stringify((tasksFull || []).map((t: any) => ({
  id: t.id,
  t: t.title,
  p: t.priority,
  c: columnMap[t.column_id] || '?',
  h: t.estimated_hours,
  tags: t.tags,
  a: t.assignees?.length || 0,
})))}`

        // For task_generator: fetch library docs via Context7
        let libraryDocs = ''
        if (action === 'agent_task_generator') {
          const libraries = ['vue', 'nuxt', 'tailwindcss', 'pinia', 'supabase']
          const docResults = await Promise.allSettled(
            libraries.map(lib => getLibraryDocumentation(lib))
          )
          const docs = docResults
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
            .map(r => r.value)
          if (docs.length > 0) {
            libraryDocs = docs.join('\n\n')
          }
        }

        systemPrompt = buildTaskAgentSystemPrompt(taskAgentConfig, projectContext, libraryDocs || undefined)
        userPrompt = context.userInput
          ? `Instrucción del usuario: ${String(context.userInput).slice(0, 2000)}\n\nDatos del proyecto arriba.`
          : 'Analiza el proyecto y sus tareas usando los datos proporcionados.'

        // Store metadata for post-processing
        ;(event.context as any)._taskAgentMeta = {
          config: taskAgentConfig,
          workspaceId: taWsId,
          projectId: context.projectId,
          columns: columnsFull,
        }
        break
      }

      throw createError({ statusCode: 400, message: 'Unknown action' })
    }
  }

  // Prompt optimization — compress long prompts via fast LLM
  const optimized = await optimizePrompt({
    systemPrompt,
    userPrompt,
    skipOptimization: shouldSkipOptimization(action),
  })
  systemPrompt = optimized.systemPrompt
  userPrompt = optimized.userPrompt

  // Build messages array — include chat history if available
  const chatHistory = (event.context as any)._chatHistory as Array<{ role: string; content: string }> | undefined
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]
  if (chatHistory && chatHistory.length > 0) {
    for (const h of chatHistory) {
      messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })
    }
  }
  messages.push({ role: 'user', content: userPrompt })

  // Ensure all messages have non-empty content (OpenRouter rejects empty content)
  const validMessages = messages.filter(m => m.content && String(m.content).trim().length > 0)
  if (validMessages.length === 0) {
    throw createError({ statusCode: 400, message: 'No valid messages to send to AI' })
  }

  // Check token limit before making AI call
  if (resolvedWorkspaceId) {
    const overLimit = await isTokenLimitExceeded({ supabase, workspaceId: resolvedWorkspaceId })
    if (overLimit) {
      throw createError({ statusCode: 429, message: 'Token limit exceeded for this workspace. Upgrade your plan or wait for the next billing cycle.' })
    }
  }

  // Call OpenRouter — try primary model, fallback to secondary on failure
  const primaryModel = 'minimax/minimax-m2.5'
  const fallbackModel = 'google/gemini-2.0-flash-001'
  const maxTokens = action === 'document_architecture' ? 16384
    : (event.context as any)._docAgentMeta?.config?.maxTokens
      || (event.context as any)._taskAgentMeta?.config?.maxTokens
      || 8192

  let response: any
  let usedModel = primaryModel
  try {
    response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://focusflow.app',
        'X-Title': 'FocusFlow',
      },
      body: {
        model: primaryModel,
        messages: validMessages,
        temperature: 0.7,
        max_tokens: maxTokens,
      },
    })
  } catch (fetchError: any) {
    console.error(`[ai] ${primaryModel} failed for action=${action}:`, fetchError.data?.error || fetchError.message)

    // Retry with fallback model
    try {
      usedModel = fallbackModel
      console.log(`[ai] Retrying with fallback model ${fallbackModel} for action=${action}`)
      response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://focusflow.app',
          'X-Title': 'FocusFlow',
        },
        body: {
          model: fallbackModel,
          messages: validMessages,
          temperature: 0.7,
          max_tokens: maxTokens,
        },
      })
    } catch (fallbackError: any) {
      console.error(`[ai] Fallback ${fallbackModel} also failed:`, fallbackError.data?.error || fallbackError.message)
      const detail = fallbackError.data?.error?.message || fetchError.data?.error?.message || 'Model unavailable'
      throw createError({ statusCode: 502, message: `AI service unavailable: ${detail}` })
    }
  }

  const content = response.choices?.[0]?.message?.content || ''
  if (!content) {
    throw createError({ statusCode: 502, message: 'AI returned empty response' })
  }

  // Record token usage (fire-and-forget)
  if (resolvedWorkspaceId && response.usage) {
    recordTokenUsage({
      supabase,
      userId: user.id,
      workspaceId: resolvedWorkspaceId,
      action,
      model: usedModel,
      usage: response.usage,
    }).catch(() => {})
  }

  const parsed = extractJSON(content)
  if (parsed !== null) {
    // Auto-store architecture document as memory (fire-and-forget)
    if (action === 'document_architecture' && parsed.title) {
      const docArchMeta = (event.context as any)._docArchMeta
      if (docArchMeta?.workspaceId) {
        storeMemory({
          supabase,
          workspaceId: docArchMeta.workspaceId,
          contentText: `Arquitectura: ${parsed.title}. ${parsed.summary || ''}. Secciones: ${(parsed.sections || []).map((s: any) => s.heading).join(', ')}`,
          agentType: 'architecture',
          contentType: 'document',
          projectId: docArchMeta.projectId,
          metadata: { action: 'document_architecture' },
          createdBy: user.id,
        }).catch(() => {})
      }
    }

    // Post-processing for document_architecture: save doc + create tasks
    if (action === 'document_architecture' && parsed.title) {
      const meta = (event.context as any)._docArchMeta
      if (meta) {
        try {
          // 1. Save document to DB — sanitize AI output
          const docTitle = String(parsed.title || 'Documento de Arquitectura').slice(0, 500)
          const docSummary = parsed.summary ? String(parsed.summary).slice(0, 2000) : null
          const docContent = {
            sections: Array.isArray(parsed.sections) ? parsed.sections : [],
            diagrams: Array.isArray(parsed.diagrams) ? parsed.diagrams : [],
            risks: Array.isArray(parsed.risks) ? parsed.risks : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          }
          const { data: document } = await supabase
            .from('documents')
            .insert({
              workspace_id: meta.workspaceId,
              project_id: meta.projectId,
              author_id: user.id,
              title: docTitle,
              summary: docSummary,
              content: docContent,
              doc_type: 'architecture',
            })
            .select()
            .single()

          // 2. Find columns of the project to distribute tasks intelligently
          const { data: allColumns } = await supabase
            .from('kanban_columns')
            .select('id, title, position')
            .eq('project_id', meta.projectId)
            .order('position', { ascending: true })

          // Use second column (first actionable) if available, else first
          const firstColumn = allColumns && allColumns.length > 1
            ? allColumns[1]
            : allColumns?.[0] || null

          // 3. Generate tasks with a DEDICATED second AI call
          const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical']
          let createdTasks: any[] = []

          if (firstColumn) {
            let aiTasks: any[] = []
            try {
              const taskGenResponse = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openrouterApiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'https://focusflow.app',
                  'X-Title': 'FocusFlow',
                },
                body: {
                  model: 'minimax/minimax-m2.5',
                  messages: [
                    {
                      role: 'system',
                      content: `Tech lead. Genera 8 tareas JSON array del doc arquitectura: 3 Backend, 3 DevOps, 2 Docs.
Cada: {title,title_en,description,description_en,priority,tags:[],estimated_hours}
Description: objetivo + pasos implementación + archivos + criterios ✅ + notas técnicas. Detallado y ejecutable. Bilingüe ES+EN. Solo JSON.`,
                    },
                    {
                      role: 'user',
                      content: `${docTitle}|${docSummary || ''}|S:${(docContent.sections as any[]).map((s: any) => s.heading).join(',')}|R:${(docContent.risks as string[]).slice(0, 5).join(',')}`,
                    },
                  ],
                  temperature: 0.7,
                  max_tokens: 6144,
                },
              })

              // Record token usage for task generation call
              if (resolvedWorkspaceId && taskGenResponse.usage) {
                recordTokenUsage({
                  supabase,
                  userId: user.id,
                  workspaceId: resolvedWorkspaceId,
                  action: 'document_architecture_tasks',
                  model: 'minimax/minimax-m2.5',
                  usage: taskGenResponse.usage,
                }).catch(() => {})
              }

              const taskContent = taskGenResponse.choices?.[0]?.message?.content || ''
              console.log('[document_architecture] Task AI raw response length:', taskContent.length)
              const tasksParsed = extractJSON(taskContent)

              if (Array.isArray(tasksParsed)) {
                aiTasks = tasksParsed.slice(0, 7)
              } else if (tasksParsed && Array.isArray(tasksParsed.tasks)) {
                aiTasks = tasksParsed.tasks.slice(0, 7)
              }
              console.log('[document_architecture] Parsed tasks count:', aiTasks.length)
            } catch (taskAiErr: any) {
              console.error('[document_architecture] Task generation AI error:', taskAiErr.message)
            }

            // Batch insert tasks
            if (aiTasks.length > 0) {
              const { data: maxPosData } = await supabase
                .from('tasks')
                .select('position')
                .eq('column_id', firstColumn.id)
                .order('position', { ascending: false })
                .limit(1)

              let nextPosition = (maxPosData && maxPosData.length > 0) ? maxPosData[0].position + 1 : 0

              const taskRows = aiTasks
                .filter((t: any) => t.title && typeof t.title === 'string')
                .map((aiTask: any) => {
                  const row: Record<string, unknown> = {
                    project_id: meta.projectId,
                    column_id: firstColumn.id,
                    title: String(aiTask.title).slice(0, 500),
                    description: aiTask.description ? String(aiTask.description).slice(0, 10000) : null,
                    priority: VALID_PRIORITIES.includes(aiTask.priority) ? aiTask.priority : 'medium',
                    assignees: [user.id],
                    reporter_id: user.id,
                    tags: [...(Array.isArray(aiTask.tags) ? aiTask.tags.map((t: any) => String(t).slice(0, 50)) : []), 'documentación'],
                    estimated_hours: typeof aiTask.estimated_hours === 'number' ? aiTask.estimated_hours : null,
                    position: nextPosition,
                  }
                  if (aiTask.title_en) row.title_en = String(aiTask.title_en).slice(0, 500)
                  if (aiTask.description_en) row.description_en = String(aiTask.description_en).slice(0, 10000)
                  nextPosition++
                  return row
                })

              if (taskRows.length > 0) {
                const { data: inserted, error: insertErr } = await supabase
                  .from('tasks')
                  .insert(taskRows)
                  .select()

                if (insertErr) {
                  console.error('[document_architecture] Task insert error:', insertErr.message)
                } else {
                  createdTasks = inserted || []
                  console.log('[document_architecture] Tasks inserted:', createdTasks.length)
                }
              }
            } else {
              console.warn('[document_architecture] No tasks generated by AI — fallback to hardcoded')
              // Fallback: create basic doc tasks if AI didn't produce any
              const { data: maxPosData } = await supabase
                .from('tasks')
                .select('position')
                .eq('column_id', firstColumn.id)
                .order('position', { ascending: false })
                .limit(1)

              let nextPosition = (maxPosData && maxPosData.length > 0) ? maxPosData[0].position + 1 : 0

              const fallbackTasks = [
                { title: `Revisar documento: ${docTitle}`, description: 'Revisar y validar el documento de arquitectura generado por AI. Verificar que las secciones de backend y DevOps estén completas.', priority: 'high' as const, estimated_hours: 1, tags: ['documentación'] },
                { title: 'Configurar pipeline CI/CD', description: 'Implementar pipeline de integración continua con linting, testing y deploy automático. Definir stages: build → test → staging → production.', priority: 'high' as const, estimated_hours: 4, tags: ['devops', 'ci-cd'] },
                { title: 'Configurar Docker y docker-compose', description: 'Crear Dockerfile multi-stage para la app. Configurar docker-compose con servicios (app, db, cache). Documentar variables de entorno.', priority: 'high' as const, estimated_hours: 3, tags: ['devops', 'docker'] },
                { title: 'Documentar endpoints de API REST', description: 'Documentar todos los endpoints: método, ruta, parámetros, body, respuestas, códigos de error. Incluir ejemplos de request/response.', priority: 'medium' as const, estimated_hours: 4, tags: ['backend', 'documentación'] },
                { title: 'Implementar logging estructurado y health checks', description: 'Configurar logging JSON con correlation IDs. Crear endpoint /health con checks de DB, storage y servicios externos.', priority: 'medium' as const, estimated_hours: 3, tags: ['devops', 'monitoring'] },
                { title: 'Revisar seguridad: RLS, validación de inputs, rate limiting', description: 'Auditar políticas RLS en todas las tablas. Verificar validación de inputs en endpoints. Implementar rate limiting en rutas sensibles.', priority: 'high' as const, estimated_hours: 3, tags: ['backend', 'seguridad'] },
                { title: 'Configurar estrategia de testing', description: 'Definir estructura de tests unitarios e integración. Configurar Vitest con fixtures y mocks de Supabase. Objetivo: cobertura mínima 70%.', priority: 'medium' as const, estimated_hours: 4, tags: ['backend', 'testing'] },
                { title: 'Crear diagrama de infraestructura y flujo de deploy', description: 'Documentar arquitectura de infraestructura (hosting, DB, storage, CDN). Crear diagrama de flujo de deployment y rollback.', priority: 'low' as const, estimated_hours: 2, tags: ['devops', 'documentación'] },
              ]

              const fallbackRows = fallbackTasks.map(ft => ({
                project_id: meta.projectId,
                column_id: firstColumn.id,
                title: ft.title,
                description: ft.description,
                priority: ft.priority,
                assignees: [user.id],
                reporter_id: user.id,
                tags: ft.tags,
                estimated_hours: ft.estimated_hours,
                position: nextPosition++,
              }))

              const { data: inserted, error: insertErr } = await supabase
                .from('tasks')
                .insert(fallbackRows)
                .select()

              if (insertErr) {
                console.error('[document_architecture] Fallback task insert error:', insertErr.message)
              } else {
                createdTasks = inserted || []
                console.log('[document_architecture] Fallback tasks inserted:', createdTasks.length)
              }
            }
          } else {
            console.error('[document_architecture] No kanban column found for project:', meta.projectId)
          }

          // 4. Save architecture document as .md file in workspace storage
          let savedFile = null
          try {
            const mdSections = (parsed.sections || [])
              .map((s: any) => `## ${s.heading}\n\n${s.content}`)
              .join('\n\n')
            const mdRisks = (parsed.risks || []).length
              ? `## Riesgos\n\n${parsed.risks.map((r: string) => `- ${r}`).join('\n')}`
              : ''
            const mdRecs = (parsed.recommendations || []).length
              ? `## Recomendaciones\n\n${parsed.recommendations.map((r: string) => `- ${r}`).join('\n')}`
              : ''
            const mdContent = `# ${docTitle}\n\n> ${docSummary || ''}\n\n${mdSections}\n\n${mdRisks}\n\n${mdRecs}`.trim()

            const safeName = docTitle.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 80)
            const fileName = `${safeName}.md`

            const fileBuffer = new TextEncoder().encode(mdContent)
            const timestamp = Date.now()
            const storagePath = `${meta.workspaceId}/documentos/${timestamp}_${fileName}`

            await supabase.storage
              .from('workspace-files')
              .upload(storagePath, fileBuffer, { contentType: 'text/markdown', upsert: false })

            const { data: fileRecord } = await supabase
              .from('workspace_files')
              .insert({
                workspace_id: meta.workspaceId,
                project_id: meta.projectId,
                uploaded_by: user.id,
                file_name: fileName,
                file_path: storagePath,
                file_size: fileBuffer.length,
                mime_type: 'text/markdown',
                folder: '/documentos',
                source: 'ai_generated',
              })
              .select()
              .single()

            savedFile = fileRecord
          } catch (fileErr: any) {
            console.error('[document_architecture] File save error:', fileErr.message)
          }

          return {
            type: 'json',
            data: {
              ...parsed,
              document,
              createdTasks,
              tasksCreated: createdTasks.length,
              savedFile,
            },
          }
        } catch (postErr: any) {
          console.error('[document_architecture] Post-processing error:', postErr.message)
          // Return AI data even if post-processing fails
          return { type: 'json', data: { ...parsed, tasksCreated: 0, postError: postErr.message } }
        }
      }
    }

    // Post-processing for doc agent actions
    if (isDocAgentAction(action) && parsed?.title) {
      const docMeta = (event.context as any)._docAgentMeta
      if (docMeta) {
        try {
          const result = await postProcessDocAgent({
            supabase,
            config: docMeta.config,
            parsed,
            sessionId: docMeta.sessionId,
            workspaceId: docMeta.workspaceId,
            projectId: docMeta.projectId,
            userId: user.id,
            openrouterApiKey,
            userPrompt,
          })

          return {
            type: 'json',
            data: {
              ...parsed,
              ...result,
            },
          }
        } catch (postErr: any) {
          console.error(`[${action}] Post-processing error:`, postErr.message)
          return { type: 'json', data: { ...parsed, tasksCreated: 0, postError: postErr.message } }
        }
      }
    }

    // Post-processing for task management agent actions
    if (isTaskAgentAction(action) && parsed) {
      const taMeta = (event.context as any)._taskAgentMeta
      if (taMeta) {
        try {
          let createdTasks: any[] = []
          const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical']

          // For sprint_planner and task_generator: create the new tasks
          const newTasks = parsed.new_tasks || parsed.tasks || []
          if (Array.isArray(newTasks) && newTasks.length > 0 && taMeta.columns?.length > 0) {
            const firstColumn = taMeta.columns.length > 1 ? taMeta.columns[1] : taMeta.columns[0]

            const { data: maxPosData } = await supabase
              .from('tasks')
              .select('position')
              .eq('column_id', firstColumn.id)
              .order('position', { ascending: false })
              .limit(1)

            let nextPosition = (maxPosData?.[0]?.position ?? -1) + 1

            const taskRows = newTasks
              .filter((t: any) => t.title && typeof t.title === 'string')
              .slice(0, 12)
              .map((t: any) => {
                const row: Record<string, unknown> = {
                  project_id: taMeta.projectId,
                  column_id: firstColumn.id,
                  title: String(t.title).slice(0, 500),
                  description: t.description ? String(t.description).slice(0, 10000) : null,
                  priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'medium',
                  assignees: [user.id],
                  reporter_id: user.id,
                  tags: Array.isArray(t.tags) ? t.tags.map((tag: any) => String(tag).slice(0, 50)) : [],
                  estimated_hours: typeof t.estimated_hours === 'number' ? t.estimated_hours : null,
                  position: nextPosition,
                }
                if (t.title_en) row.title_en = String(t.title_en).slice(0, 500)
                if (t.description_en) row.description_en = String(t.description_en).slice(0, 10000)
                nextPosition++
                return row
              })

            if (taskRows.length > 0) {
              const { data: inserted, error: insertErr } = await supabase
                .from('tasks')
                .insert(taskRows)
                .select()

              if (insertErr) {
                console.error(`[${action}] Task insert error:`, insertErr.message)
              } else {
                createdTasks = inserted || []
              }
            }
          }

          // For task_improver: apply improvements to existing tasks
          if (action === 'agent_task_improver' && Array.isArray(parsed.improvements)) {
            let improved = 0
            for (const imp of parsed.improvements.slice(0, 20)) {
              if (!imp.task_id) continue
              const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
              if (imp.improved_title) updates.title = String(imp.improved_title).slice(0, 500)
              if (imp.improved_description) updates.description = String(imp.improved_description).slice(0, 10000)
              if (imp.improved_title_en) updates.title_en = String(imp.improved_title_en).slice(0, 500)
              if (imp.improved_description_en) updates.description_en = String(imp.improved_description_en).slice(0, 10000)
              if (VALID_PRIORITIES.includes(imp.suggested_priority)) updates.priority = imp.suggested_priority
              if (typeof imp.suggested_estimated_hours === 'number') updates.estimated_hours = imp.suggested_estimated_hours
              if (Array.isArray(imp.suggested_tags)) updates.tags = imp.suggested_tags.map((t: any) => String(t).slice(0, 50))

              const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', imp.task_id)
                .eq('project_id', taMeta.projectId)

              if (!error) improved++
            }
            parsed._tasksImproved = improved

            // Also create missing tasks if detected
            if (Array.isArray(parsed.missing_tasks) && parsed.missing_tasks.length > 0 && taMeta.columns?.length > 0) {
              const firstCol = taMeta.columns.length > 1 ? taMeta.columns[1] : taMeta.columns[0]
              const { data: maxP } = await supabase
                .from('tasks')
                .select('position')
                .eq('column_id', firstCol.id)
                .order('position', { ascending: false })
                .limit(1)

              let pos = (maxP?.[0]?.position ?? -1) + 1
              const missingRows = parsed.missing_tasks
                .filter((t: any) => t.title)
                .slice(0, 5)
                .map((t: any) => {
                  const row: Record<string, unknown> = {
                    project_id: taMeta.projectId,
                    column_id: firstCol.id,
                    title: String(t.title).slice(0, 500),
                    description: t.description ? String(t.description).slice(0, 10000) : null,
                    priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'medium',
                    assignees: [user.id],
                    reporter_id: user.id,
                    tags: Array.isArray(t.tags) ? t.tags.map((tag: any) => String(tag).slice(0, 50)) : [],
                    estimated_hours: typeof t.estimated_hours === 'number' ? t.estimated_hours : null,
                    position: pos++,
                  }
                  if (t.title_en) row.title_en = String(t.title_en).slice(0, 500)
                  if (t.description_en) row.description_en = String(t.description_en).slice(0, 10000)
                  return row
                })

              if (missingRows.length > 0) {
                const { data: ins } = await supabase.from('tasks').insert(missingRows).select()
                createdTasks = [...createdTasks, ...(ins || [])]
              }
            }
          }

          // Auto-generate implementation guide .md for created tasks (fire-and-forget)
          if (createdTasks.length > 0) {
            generateTaskDocs({
              supabase,
              workspaceId: taMeta.workspaceId,
              projectId: taMeta.projectId,
              userId: user.id,
              tasks: createdTasks.map((t: any) => ({ id: t.id, title: t.title, description: t.description })),
            }).catch(() => {})
          }

          // Store memory (fire-and-forget)
          storeMemory({
            supabase,
            workspaceId: taMeta.workspaceId,
            contentText: `${taMeta.config.name}: ${parsed.summary || parsed.sprint_name || parsed.feature_summary || JSON.stringify(parsed).slice(0, 500)}`,
            agentType: taMeta.config.agentType,
            contentType: 'task_agent',
            projectId: taMeta.projectId,
            metadata: { action },
            createdBy: user.id,
          }).catch(() => {})

          return {
            type: 'json',
            data: {
              ...parsed,
              createdTasks,
              tasksCreated: createdTasks.length,
            },
          }
        } catch (postErr: any) {
          console.error(`[${action}] Task agent post-processing error:`, postErr.message)
          return { type: 'json', data: { ...parsed, tasksCreated: 0, postError: postErr.message } }
        }
      }
    }

    // Auto-generate implementation guide .md for chat-created tasks (fire-and-forget)
    const chatDocMeta = (event.context as any)._chatMemoryMeta
    if (action === 'chat' && Array.isArray(parsed) && parsed.length > 0 && chatDocMeta?.workspaceId && chatDocMeta?.projectId) {
      generateTaskDocs({
        supabase,
        workspaceId: chatDocMeta.workspaceId,
        projectId: chatDocMeta.projectId,
        userId: chatDocMeta.userId,
        tasks: parsed.filter((t: any) => t.title).map((t: any) => ({
          id: t.id || '',
          title: t.title,
          description: t.description || null,
        })),
      }).catch((err: any) => console.error('[chat] Task doc gen error:', err.message))
    }

    // Auto-store chat Q+A as memory (fire-and-forget)
    const chatMemMeta = (event.context as any)._chatMemoryMeta
    if (action === 'chat' && chatMemMeta?.workspaceId) {
      const responseText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
      if (responseText.length > 100) {
        storeMemory({
          supabase,
          workspaceId: chatMemMeta.workspaceId,
          contentText: `Q: ${chatMemMeta.userMessage}\nA: ${responseText.slice(0, 2000)}`,
          agentType: 'memory',
          contentType: 'chat',
          projectId: chatMemMeta.projectId || null,
          metadata: { action: 'chat' },
          createdBy: chatMemMeta.userId,
        }).catch(() => {})
      }
    }

    return { type: 'json', data: parsed }
  }

  // Auto-store text chat responses as memory (fire-and-forget)
  const chatMemMeta = (event.context as any)._chatMemoryMeta
  if (action === 'chat' && chatMemMeta?.workspaceId && content.length > 100) {
    storeMemory({
      supabase,
      workspaceId: chatMemMeta.workspaceId,
      contentText: `Q: ${chatMemMeta.userMessage}\nA: ${content.slice(0, 2000)}`,
      agentType: 'memory',
      contentType: 'chat',
      projectId: chatMemMeta.projectId || null,
      metadata: { action: 'chat' },
      createdBy: chatMemMeta.userId,
    }).catch(() => {})
  }

  return { type: 'text', data: content }
})
