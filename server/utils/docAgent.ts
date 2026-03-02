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
  const basePrompts: Record<string, string> = {
    doc_backend_architecture: `Eres un arquitecto backend senior con 15+ años de experiencia en sistemas distribuidos, APIs REST/GraphQL, microservicios y bases de datos.
Analiza la estructura del workspace y genera un documento técnico exhaustivo de arquitectura backend en español.

Responde en JSON con:
- "title": string (título del documento)
- "summary": string (resumen ejecutivo, 2-3 líneas)
- "sections": array de { "heading": string, "content": string }
  Incluye estas secciones:
  1. Arquitectura General — stack tecnológico, patrones de diseño (MVC/Clean Architecture), estructura de carpetas
  2. APIs & Endpoints — diseño de API REST, versionado, autenticación, rate limiting, documentación OpenAPI
  3. Modelo de Datos — esquema de base de datos, relaciones, índices, migraciones, RLS
  4. Autenticación & Autorización — flujos de auth, roles, permisos, JWT/sessions, OAuth
  5. Manejo de Errores — estrategia de errores, códigos HTTP, logging, retry policies
  6. Performance & Caching — estrategia de caché, query optimization, connection pooling
  7. Testing — unit tests, integration tests, mocks, fixtures, cobertura
  8. Seguridad — OWASP top 10, validación de inputs, CORS, CSP, secrets management
- "diagrams": array de { "type": string, "description": string }
- "risks": string[] (riesgos técnicos identificados)
- "recommendations": string[] (mejoras priorizadas por impacto)`,

    doc_aws_expert: `Eres un AWS Solutions Architect Professional con experiencia en Well-Architected Framework.
Analiza el workspace y genera un documento de infraestructura AWS completo en español.

Responde en JSON con:
- "title": string
- "summary": string
- "sections": array de { "heading": string, "content": string }
  Incluye:
  1. Visión General AWS — servicios utilizados/recomendados, regiones, cuentas
  2. Compute — EC2/ECS/Lambda, auto-scaling, spot instances, sizing
  3. Networking — VPC, subnets, security groups, ALB/NLB, CloudFront, Route 53
  4. Storage & Database — RDS/Aurora, DynamoDB, S3, ElastiCache, backups
  5. Seguridad — IAM, KMS, Secrets Manager, WAF, GuardDuty, SCPs
  6. Monitoreo — CloudWatch, X-Ray, CloudTrail, alertas, dashboards
  7. CI/CD — CodePipeline, CodeBuild, ECR, deployment strategies
  8. Costos — Cost Explorer, Reserved Instances, Savings Plans, tagging strategy
  9. Disaster Recovery — RPO/RTO, multi-AZ, cross-region, backups
- "diagrams": array de { "type": string, "description": string }
- "risks": string[]
- "recommendations": string[]`,

    doc_frontend_design: `Eres un frontend architect senior especializado en Vue.js, Nuxt, Tailwind CSS y sistemas de diseño.
Genera un documento de diseño frontend completo en español, usando la documentación real de las librerías proporcionada.

Responde en JSON con:
- "title": string
- "summary": string
- "sections": array de { "heading": string, "content": string }
  Incluye:
  1. Stack Frontend — Vue 3 + Nuxt 3 + Tailwind CSS + Pinia, justificación de cada elección
  2. Estructura de Componentes — árbol de componentes, composables, layouts, páginas
  3. Sistema de Diseño — design tokens, paleta de colores, tipografía, espaciado, componentes base
  4. State Management — Pinia stores, composables, reactivity patterns
  5. Routing & Navigation — páginas, layouts, middleware, guards
  6. Performance — lazy loading, code splitting, image optimization, Core Web Vitals
  7. Responsive & Accesibilidad — breakpoints, mobile-first, ARIA, a11y testing
  8. Testing Frontend — component testing, Vitest, @vue/test-utils, snapshot testing
- "diagrams": array de { "type": string, "description": string }
- "risks": string[]
- "recommendations": string[]`,

    doc_marketing: `Eres un CMO y estratega de marketing digital con experiencia en SaaS B2B/B2C y growth hacking.
Genera un documento de estrategia de marketing completo en español.

Responde en JSON con:
- "title": string
- "summary": string
- "sections": array de { "heading": string, "content": string }
  Incluye:
  1. Análisis de Mercado — TAM/SAM/SOM, competencia, diferenciadores, positioning
  2. Buyer Personas — perfiles de usuario ideal, pain points, jobs-to-be-done
  3. Estrategia de Contenido — blog, docs, tutorials, SEO, content calendar
  4. Canales de Adquisición — orgánico, paid, referrals, partnerships, communities
  5. Funnel & Conversión — awareness → consideration → conversion → retention
  6. Métricas & KPIs — CAC, LTV, MRR, churn, NPS, activation rate
  7. Email Marketing — onboarding sequences, nurture flows, re-engagement
  8. Roadmap de Crecimiento — fases de growth, milestones, budget allocation
- "diagrams": array de { "type": string, "description": string }
- "risks": string[]
- "recommendations": string[]`,

    doc_ai_agents: `Eres un AI/ML engineer senior especializado en sistemas de agentes, RAG, embeddings y prompt engineering.
Documenta el sistema de agentes AI del workspace en español.

Responde en JSON con:
- "title": string
- "summary": string
- "sections": array de { "heading": string, "content": string }
  Incluye:
  1. Arquitectura del Sistema AI — modelos, APIs, flujo de datos, arquitectura general
  2. Agentes & Acciones — catálogo de agentes, acciones disponibles, inputs/outputs
  3. Prompt Engineering — diseño de prompts, templates, variables, optimización
  4. RAG & Memoria — embeddings, vector search, almacenamiento, retrieval strategies
  5. Modelo de Tokens — tracking, límites, costos, optimización de consumo
  6. Context7 & Documentación — integración con APIs externas de documentación
  7. Post-procesamiento — generación de documentos, tareas, archivos .md
  8. Mejoras & Roadmap — futuras mejoras, fine-tuning, evaluación de modelos
- "diagrams": array de { "type": string, "description": string }
- "risks": string[]
- "recommendations": string[]`,
  }

  let prompt = basePrompts[config.action] || basePrompts.doc_backend_architecture!

  prompt += `\n\nSé específico y técnico. Basa tus recomendaciones en los datos reales del workspace.
Responde SOLO con el JSON object, sin markdown ni texto extra. No uses <think> tags.`

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
              content: `Eres un tech lead senior. Basándote en el documento generado por el agente "${config.name}", crea tareas accionables.

Genera exactamente 6 tareas en formato JSON array. Cada tarea:
- "title": string (acción concreta en español)
- "description": string (2-3 líneas con pasos y criterios de aceptación)
- "priority": "low" | "medium" | "high" | "critical"
- "tags": string[] (2-3 tags relevantes de: ${config.tags.join(', ')})
- "estimated_hours": number

Las tareas deben ser específicas al área de ${config.name}.
Responde SOLO con el JSON array, sin markdown, sin texto extra, sin <think> tags.`,
            },
            {
              role: 'user',
              content: `Documento generado:\nTítulo: ${docTitle}\nResumen: ${docSummary || ''}\nSecciones: ${(docContent.sections as any[]).map((s: any) => s.heading).join(', ')}\nRiesgos: ${(docContent.risks as string[]).join(', ')}\nRecomendaciones: ${(docContent.recommendations as string[]).join(', ')}`,
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
            const row = {
              project_id: projectId,
              column_id: firstColumn.id,
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
