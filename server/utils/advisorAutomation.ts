import { VALID_AGENT_TYPES } from './agentAI'

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
const DEFAULT_MAX_TASKS = 8

type Priority = typeof VALID_PRIORITIES[number]

export interface AdvisorColumnContext {
  id: string
  title: string
  position?: number | null
}

export interface AdvisorProjectContext {
  id: string
  name: string
  owner_id?: string | null
  columns: AdvisorColumnContext[]
}

export interface AdvisorAutomationTask {
  project_id: string
  column_id: string
  title: string
  description: string | null
  priority: Priority
  estimated_hours: number | null
  due_date: string | null
  assignees: string[]
  tags: string[]
  ai_agent: string | null
  reporter_id: string
}

export interface AdvisorAutomationPlan {
  reply: string
  analysis: {
    intent: string
    should_create_tasks: boolean
    confidence: number | null
  }
  tasks: AdvisorAutomationTask[]
}

export function normalizeAdvisorAutomation(raw: any, context: {
  projects: AdvisorProjectContext[]
  validAssigneeIds: string[]
  reporterId: string
  maxTasks?: number
}): AdvisorAutomationPlan {
  const validAssignees = new Set(context.validAssigneeIds)
  if (validAssignees.size === 0) validAssignees.add(context.reporterId)

  const analysisRaw = raw && typeof raw.analysis === 'object' ? raw.analysis : {}
  const shouldCreate = analysisRaw.should_create_tasks !== false
  const tasksRaw = shouldCreate && Array.isArray(raw?.tasks) ? raw.tasks : []

  const tasks: AdvisorAutomationTask[] = []
  for (const item of tasksRaw.slice(0, context.maxTasks || DEFAULT_MAX_TASKS)) {
    if (!item || typeof item !== 'object') continue

    const title = cleanString(item.title, 500)
    if (title.length < 3) continue

    const project = resolveProject(item, context.projects)
    if (!project || project.columns.length === 0) continue

    const column = resolveColumn(item, project)
    const assignees = resolveAssignees(item, project, context.reporterId, validAssignees)
    const aiAgent = normalizeAgent(item.ai_agent || item.agent, item)

    tasks.push({
      project_id: project.id,
      column_id: column.id,
      title,
      description: cleanNullableString(item.description, 10000),
      priority: normalizePriority(item.priority),
      estimated_hours: normalizeEstimatedHours(item.estimated_hours),
      due_date: normalizeDueDate(item.due_date),
      assignees,
      tags: normalizeTags(item.tags),
      ai_agent: aiAgent,
      reporter_id: context.reporterId,
    })
  }

  return {
    reply: cleanString(raw?.reply || raw?.message || raw?.answer || '', 2400),
    analysis: {
      intent: cleanString(analysisRaw.intent || '', 80) || 'unknown',
      should_create_tasks: shouldCreate && tasks.length > 0,
      confidence: normalizeConfidence(analysisRaw.confidence),
    },
    tasks,
  }
}

export function inferAdvisorAgent(task: any): string {
  const text = normalizeSearchText([
    task?.title,
    task?.description,
    Array.isArray(task?.tags) ? task.tags.join(' ') : '',
  ].filter(Boolean).join(' '))

  const rules: Array<[string, string[]]> = [
    ['security', ['security', 'seguridad', 'owasp', 'rls', 'auth', 'permisos', 'secret', 'vulnerab']],
    ['devops', ['deploy', 'deployment', 'ci/cd', 'pipeline', 'docker', 'produccion', 'production', 'monitoring']],
    ['cloud', ['aws', 'cloud', 'lambda', 's3', 'rds', 'serverless', 'terraform', 'infraestructura']],
    ['backend', ['backend', 'api', 'endpoint', 'database', 'base de datos', 'supabase', 'migracion', 'schema', 'servidor']],
    ['frontend', ['frontend', 'ui', 'component', 'vue', 'nuxt', 'responsive', 'interfaz', 'pantalla']],
    ['qa', ['qa', 'test', 'testing', 'prueba', 'regresion', 'validacion', 'criterios de aceptacion']],
    ['designer', ['design', 'diseno', 'ux', 'wireframe', 'prototype', 'prototipo', 'figma']],
    ['data', ['data', 'datos', 'metric', 'metrica', 'dashboard', 'analytics', 'reporte']],
    ['seo', ['seo', 'keyword', 'meta tag', 'ranking', 'search console']],
    ['pricing', ['pricing', 'precio', 'precios', 'tier', 'monetizacion']],
    ['growth_planner', ['growth', 'funnel', 'retencion', 'adquisicion', 'experimento']],
    ['business_planner', ['business model', 'modelo de negocio', 'mercado', 'unit economics']],
    ['viral_content', ['viral', 'hook', 'tiktok', 'reels', 'shorts']],
    ['content_creator', ['content', 'contenido', 'post', 'video', 'guion', 'article', 'articulo']],
    ['copywriter', ['copy', 'headline', 'cta', 'landing copy', 'mensaje']],
    ['planner', ['plan', 'roadmap', 'sprint', 'tarea', 'cronograma', 'dependencia']],
  ]

  for (const [agent, keywords] of rules) {
    if (keywords.some(keyword => text.includes(keyword))) return agent
  }
  return 'planner'
}

function cleanString(value: any, max: number): string {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max)
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function cleanNullableString(value: any, max: number): string | null {
  const cleaned = String(value || '').trim().slice(0, max)
  return cleaned.length > 0 ? cleaned : null
}

function normalizePriority(value: any): Priority {
  return VALID_PRIORITIES.includes(value) ? value : 'medium'
}

function normalizeEstimatedHours(value: any): number | null {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.min(Math.round(num * 4) / 4, 500)
}

function normalizeDueDate(value: any): string | null {
  const text = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

function normalizeConfidence(value: any): number | null {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.max(0, Math.min(1, num))
}

function normalizeTags(value: any): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const tags: string[] = []
  for (const tag of value) {
    const cleaned = cleanString(tag, 40)
    if (!cleaned || seen.has(cleaned.toLowerCase())) continue
    seen.add(cleaned.toLowerCase())
    tags.push(cleaned)
    if (tags.length >= 8) break
  }
  return tags
}

function normalizeAgent(value: any, task: any): string | null {
  const agent = cleanString(value, 80)
  if (VALID_AGENT_TYPES.includes(agent)) return agent
  return inferAdvisorAgent(task)
}

function resolveProject(task: any, projects: AdvisorProjectContext[]): AdvisorProjectContext | null {
  if (projects.length === 0) return null

  const projectId = cleanString(task.project_id, 120)
  if (projectId) {
    const byId = projects.find(project => project.id === projectId)
    if (byId) return byId
  }

  const projectName = cleanString(task.project || task.project_name, 200).toLowerCase()
  if (projectName) {
    const byName = projects.find(project => project.name.toLowerCase() === projectName)
      || projects.find(project => project.name.toLowerCase().includes(projectName) || projectName.includes(project.name.toLowerCase()))
    if (byName) return byName
  }

  return projects[0] || null
}

function resolveColumn(task: any, project: AdvisorProjectContext): AdvisorColumnContext {
  const columnId = cleanString(task.column_id, 120)
  if (columnId) {
    const byId = project.columns.find(column => column.id === columnId)
    if (byId) return byId
  }

  const columnHint = cleanString(task.column || task.status, 200).toLowerCase()
  if (columnHint) {
    const byTitle = project.columns.find(column => column.title.toLowerCase() === columnHint)
      || project.columns.find(column => column.title.toLowerCase().includes(columnHint) || columnHint.includes(column.title.toLowerCase()))
    if (byTitle) return byTitle
  }

  return [...project.columns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0]!
}

function resolveAssignees(task: any, project: AdvisorProjectContext, reporterId: string, validAssignees: Set<string>): string[] {
  const candidates = [
    task.assignee_id,
    ...(Array.isArray(task.assignee_ids) ? task.assignee_ids : []),
    ...(Array.isArray(task.assignees) ? task.assignees : []),
  ].map(candidate => cleanString(candidate, 120))

  const assignees = candidates.filter(candidate => validAssignees.has(candidate))
  if (assignees.length > 0) return [...new Set(assignees)].slice(0, 3)

  if (project.owner_id && validAssignees.has(project.owner_id)) return [project.owner_id]
  if (validAssignees.has(reporterId)) return [reporterId]
  return []
}
