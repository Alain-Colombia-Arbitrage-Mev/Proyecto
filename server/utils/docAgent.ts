import { randomUUID } from 'uncrypto'

export interface DocAgentConfig {
  action: string
  name: string
  description: string
  icon: string
  color: string
  folder: string
  agentType: string
  docType: string
  maxTokens: number
  tags: string[]
}

/** Registry of all documentation agents */
export const DOC_AGENTS: Record<string, DocAgentConfig> = {
  doc_backend_architecture: {
    action: 'doc_backend_architecture',
    name: 'Backend Senior Architecture',
    description: 'Genera documentación detallada de arquitectura backend: APIs, modelos de datos, patrones de diseño, seguridad y testing.',
    icon: 'i-heroicons-server-stack',
    color: '#3B82F6',
    folder: '/docs/backend',
    agentType: 'backend_arch',
    docType: 'backend_architecture',
    maxTokens: 16384,
    tags: ['backend', 'arquitectura'],
  },
  doc_aws_expert: {
    action: 'doc_aws_expert',
    name: 'AWS Senior Expert',
    description: 'Documenta infraestructura AWS: servicios, configuración, costos, seguridad, escalabilidad y disaster recovery.',
    icon: 'i-heroicons-cloud',
    color: '#F59E0B',
    folder: '/docs/aws',
    agentType: 'aws_expert',
    docType: 'aws_infrastructure',
    maxTokens: 16384,
    tags: ['aws', 'cloud', 'infra'],
  },
  doc_frontend_design: {
    action: 'doc_frontend_design',
    name: 'Frontend Design (Context7)',
    description: 'Genera guías de diseño frontend con documentación real de Vue, Nuxt, Tailwind y Pinia vía Context7 API.',
    icon: 'i-heroicons-paint-brush',
    color: '#EC4899',
    folder: '/docs/frontend',
    agentType: 'frontend_design',
    docType: 'frontend_design',
    maxTokens: 16384,
    tags: ['frontend', 'diseño', 'ui'],
  },
  doc_marketing: {
    action: 'doc_marketing',
    name: 'Marketing Documentation',
    description: 'Crea documentación de estrategia de marketing: audiencia, canales, contenido, métricas y roadmap de crecimiento.',
    icon: 'i-heroicons-megaphone',
    color: '#8B5CF6',
    folder: '/docs/marketing',
    agentType: 'marketing',
    docType: 'marketing_strategy',
    maxTokens: 12288,
    tags: ['marketing', 'estrategia'],
  },
  doc_ai_agents: {
    action: 'doc_ai_agents',
    name: 'AI Agents Documentation',
    description: 'Documenta el sistema de agentes AI: prompts, flujos, modelos, embeddings, memoria y optimización.',
    icon: 'i-heroicons-cpu-chip',
    color: '#10B981',
    folder: '/docs/agents',
    agentType: 'ai_agents_doc',
    docType: 'ai_agents',
    maxTokens: 16384,
    tags: ['ai', 'agentes', 'prompts'],
  },
}

/** Check if an action is a doc agent action */
export function isDocAgentAction(action: string): boolean {
  return action in DOC_AGENTS
}

/** Get doc agent config by action */
export function getDocAgentConfig(action: string): DocAgentConfig | null {
  return DOC_AGENTS[action] || null
}

/** Generate a unique session ID for a doc agent run */
export function createSessionId(): string {
  return randomUUID()
}

/** Build a specialized system prompt for a doc agent */
export function buildDocAgentSystemPrompt(config: DocAgentConfig, extraContext?: string): string {
  // Shared JSON schema for all doc agents
  const JSON_SCHEMA = `JSON:{title,summary,sections:[{heading,content}],diagrams:[{type,description}],risks:[],recommendations:[]}`

  const basePrompts: Record<string, string> = {
    doc_backend_architecture: `Arquitecto backend senior. Doc técnica ES.
${JSON_SCHEMA}
Secciones: 1.Arquitectura General(stack,patrones,carpetas) 2.APIs(REST,auth,rate limiting) 3.Modelo Datos(DB,relaciones,migraciones,RLS) 4.Auth(roles,permisos,JWT,OAuth) 5.Errores(HTTP codes,logging,retry) 6.Performance(caché,queries,pooling) 7.Testing(unit,integration,mocks) 8.Seguridad(OWASP,inputs,CORS,secrets)`,

    doc_aws_expert: `AWS Solutions Architect. Doc infra AWS ES.
${JSON_SCHEMA}
Secciones: 1.Visión General(servicios,regiones) 2.Compute(EC2/ECS/Lambda,scaling) 3.Networking(VPC,ALB,CloudFront) 4.Storage&DB(RDS,S3,ElastiCache) 5.Seguridad(IAM,KMS,WAF) 6.Monitoreo(CloudWatch,X-Ray,alertas) 7.CI/CD(CodePipeline,ECR) 8.Costos(Reserved,Savings) 9.DR(RPO/RTO,multi-AZ)`,

    doc_frontend_design: `Frontend architect senior Vue/Nuxt/Tailwind. Doc diseño frontend ES.
${JSON_SCHEMA}
Secciones: 1.Stack(Vue3+Nuxt3+Tailwind+Pinia) 2.Componentes(árbol,composables,layouts) 3.Design System(tokens,colores,tipografía) 4.State(Pinia,reactivity) 5.Routing(pages,middleware,guards) 6.Performance(lazy load,code split,CWV) 7.Responsive&A11y(breakpoints,ARIA) 8.Testing(Vitest,vue/test-utils)`,

    doc_marketing: `CMO marketing digital SaaS. Doc estrategia marketing ES.
${JSON_SCHEMA}
Secciones: 1.Mercado(TAM/SAM/SOM,competencia) 2.Personas(perfiles,pain points) 3.Contenido(blog,SEO,calendar) 4.Canales(orgánico,paid,referrals) 5.Funnel(awareness→conversion→retention) 6.KPIs(CAC,LTV,MRR,churn) 7.Email(onboarding,nurture) 8.Roadmap(fases growth,budget)`,

    doc_ai_agents: `AI/ML engineer senior. Doc sistema agentes AI ES.
${JSON_SCHEMA}
Secciones: 1.Arquitectura AI(modelos,APIs,flujo) 2.Agentes(catálogo,acciones,I/O) 3.Prompts(diseño,templates,optimización) 4.RAG&Memoria(embeddings,vector search) 5.Tokens(tracking,límites,costos) 6.Context7(APIs externas) 7.Post-proceso(docs,tareas,.md) 8.Roadmap(mejoras,fine-tuning)`,
  }

  let prompt = basePrompts[config.action] || basePrompts.doc_backend_architecture!
  prompt += `\nEspecífico, basado en datos reales. Solo JSON.`

  if (extraContext) {
    prompt += `\n\nContexto adicional de librerías/frameworks:\n${extraContext}`
  }

  return prompt
}

interface PostProcessDocAgentParams {
  supabase: any
  config: DocAgentConfig
  parsed: any
  sessionId: string
  workspaceId: string
  projectId: string
  userId: string
  openrouterApiKey: string
  userPrompt: string
}

/**
 * Shared post-processing for doc agents:
 * 1. Save to `documents` table
 * 2. Generate .md with frontmatter
 * 3. Upload to Supabase Storage
 * 4. Register in `workspace_files`
 * 5. Generate tasks with 2nd AI call
 * 6. Store memory with session_id
 */
export async function postProcessDocAgent(params: PostProcessDocAgentParams) {
  const { supabase, config, parsed, sessionId, workspaceId, projectId, userId, openrouterApiKey, userPrompt } = params

  const docTitle = String(parsed.title || `${config.name} Document`).slice(0, 500)
  const docSummary = parsed.summary ? String(parsed.summary).slice(0, 2000) : null
  const docContent = {
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    diagrams: Array.isArray(parsed.diagrams) ? parsed.diagrams : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    session_id: sessionId,
  }

  // 1. Save document to DB
  const { data: document } = await supabase
    .from('documents')
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      author_id: userId,
      title: docTitle,
      summary: docSummary,
      content: docContent,
      doc_type: config.docType,
    })
    .select()
    .single()

  // 2. Generate .md with frontmatter
  const mdSections = (parsed.sections || [])
    .map((s: any) => `## ${s.heading}\n\n${s.content}`)
    .join('\n\n')
  const mdRisks = (parsed.risks || []).length
    ? `## Riesgos\n\n${parsed.risks.map((r: string) => `- ${r}`).join('\n')}`
    : ''
  const mdRecs = (parsed.recommendations || []).length
    ? `## Recomendaciones\n\n${parsed.recommendations.map((r: string) => `- ${r}`).join('\n')}`
    : ''

  const frontmatter = `---
session_id: ${sessionId}
agent: ${config.name}
doc_type: ${config.docType}
created: ${new Date().toISOString()}
tags: [${config.tags.join(', ')}]
---`

  const mdContent = `${frontmatter}\n\n# ${docTitle}\n\n> ${docSummary || ''}\n\n${mdSections}\n\n${mdRisks}\n\n${mdRecs}`.trim()

  // 3. Upload to Supabase Storage
  let savedFile = null
  try {
    const safeName = docTitle.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 80)
    const fileName = `${safeName}.md`
    const fileBuffer = new TextEncoder().encode(mdContent)
    const timestamp = Date.now()
    const storagePath = `${workspaceId}${config.folder}/${timestamp}_${fileName}`

    await supabase.storage
      .from('workspace-files')
      .upload(storagePath, fileBuffer, { contentType: 'text/markdown', upsert: false })

    // 4. Register in workspace_files
    const { data: fileRecord } = await supabase
      .from('workspace_files')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        uploaded_by: userId,
        file_name: fileName,
        file_path: storagePath,
        file_size: fileBuffer.length,
        mime_type: 'text/markdown',
        folder: config.folder,
        source: 'ai_generated',
      })
      .select()
      .single()

    savedFile = fileRecord
  } catch (fileErr: any) {
    console.error(`[${config.action}] File save error:`, fileErr.message)
  }

  // 5. Generate tasks with 2nd AI call
  let createdTasks: any[] = []
  try {
    const { data: allColumns } = await supabase
      .from('kanban_columns')
      .select('id, title, position')
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    const firstColumn = allColumns && allColumns.length > 1
      ? allColumns[1]
      : allColumns?.[0] || null

    if (firstColumn) {
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
              content: `Tech lead. 6 tareas JSON array del doc "${config.name}": [{title,description,priority,tags:[],estimated_hours,column:"nombre columna"}]. Columnas: ${(allColumns || []).map((c: any) => c.title).join(', ')}. Asigna cada tarea a la columna más apropiada. Tags: ${config.tags.join(',')}. ES. Solo JSON.`,
            },
            {
              role: 'user',
              content: `${docTitle}|${docSummary || ''}|S:${(docContent.sections as any[]).map((s: any) => s.heading).join(',')}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        },
      })

      // Record token usage for task generation
      if (taskGenResponse.usage) {
        recordTokenUsage({
          supabase,
          userId,
          workspaceId,
          action: `${config.action}_tasks`,
          model: 'minimax/minimax-m2.5',
          usage: taskGenResponse.usage,
        }).catch(() => {})
      }

      const taskContent = taskGenResponse.choices?.[0]?.message?.content || ''
      let aiTasks: any[] = []

      // Parse tasks from response
      try {
        const tasksParsed = JSON.parse(taskContent.trim())
        aiTasks = Array.isArray(tasksParsed) ? tasksParsed : (tasksParsed?.tasks || [])
      } catch {
        const jsonMatch = taskContent.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          try { aiTasks = JSON.parse(jsonMatch[0]) } catch {}
        }
      }

      aiTasks = aiTasks.slice(0, 6)

      if (aiTasks.length > 0) {
        const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical']
        // Build column lookup for AI column matching
        const colMap = new Map((allColumns || []).map((c: any) => [c.title.toLowerCase(), c.id]))
        function resolveColId(hint?: string): string {
          if (hint) {
            const h = hint.toLowerCase().trim()
            if (colMap.has(h)) return colMap.get(h)!
            for (const [title, id] of colMap) {
              if (title.includes(h) || h.includes(title)) return id
            }
          }
          return firstColumn.id
        }

        let nextPosition = 0

        const taskRows = aiTasks
          .filter((t: any) => t.title && typeof t.title === 'string')
          .map((aiTask: any) => {
            const row = {
              project_id: projectId,
              column_id: resolveColId(aiTask.column),
              title: String(aiTask.title).slice(0, 500),
              description: aiTask.description ? String(aiTask.description).slice(0, 5000) : null,
              priority: VALID_PRIORITIES.includes(aiTask.priority) ? aiTask.priority : 'medium',
              assignees: [userId],
              reporter_id: userId,
              tags: [...(Array.isArray(aiTask.tags) ? aiTask.tags.map((t: any) => String(t).slice(0, 50)) : []), config.docType],
              estimated_hours: typeof aiTask.estimated_hours === 'number' ? aiTask.estimated_hours : null,
              position: nextPosition,
            }
            nextPosition++
            return row
          })

        if (taskRows.length > 0) {
          const { data: inserted, error: insertErr } = await supabase
            .from('tasks')
            .insert(taskRows)
            .select()

          if (insertErr) {
            console.error(`[${config.action}] Task insert error:`, insertErr.message)
          } else {
            createdTasks = inserted || []
          }
        }
      }
    }
  } catch (taskErr: any) {
    console.error(`[${config.action}] Task generation error:`, taskErr.message)
  }

  // 6. Store memory with session_id
  storeMemory({
    supabase,
    workspaceId,
    contentText: `${config.name}: ${docTitle}. ${docSummary || ''}. Secciones: ${(parsed.sections || []).map((s: any) => s.heading).join(', ')}`,
    agentType: config.agentType,
    contentType: 'doc_session',
    projectId,
    metadata: {
      action: config.action,
      session_id: sessionId,
      doc_type: config.docType,
      tags: config.tags,
    },
    createdBy: userId,
  }).catch(() => {})

  return {
    document,
    createdTasks,
    tasksCreated: createdTasks.length,
    savedFile,
    sessionId,
  }
}
