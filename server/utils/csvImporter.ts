import Papa from 'papaparse'

export interface ImportedTask {
  title: string
  description: string | null
  priority: 'critical' | 'high' | 'medium' | 'low'
  due_date: string | null
  tags: string[]
  estimated_hours: number | null
  status: string | null
  assignees: string[]
}

export interface TemplateSuggestion {
  template: string
  score: number
  matchedStatuses: string[]
  unmatchedStatuses: string[]
}

export interface ImportResult {
  platform: string
  tasks: ImportedTask[]
  suggestedTemplate?: TemplateSuggestion
}

type CsvRow = Record<string, string>

// Strip diacritics/accents for resilient header matching (límite → limite, etc.)
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Header signatures for auto-detection (supports EN + ES headers)
function detectPlatform(headers: string[]): string {
  const raw = headers.map(s => s.trim().toLowerCase())
  const h = new Set(raw)
  // Also create a set with diacritics stripped for fallback matching
  const hNorm = new Set(raw.map(stripDiacritics))

  if (h.has('id') && h.has('estimate') && h.has('cycle number')) return 'linear'
  if (h.has('issue key') && h.has('summary')) return 'jira'
  if ((h.has('card name') || h.has('card id')) && h.has('list')) return 'trello'
  // ClickUp EN
  if (h.has('task name') && h.has('estimated time')) return 'clickup'
  // ClickUp ES (Spanish export) — check with both accented and stripped diacritics
  if ((h.has('nombre') || hNorm.has('nombre')) &&
      (h.has('persona asignada') || hNorm.has('persona asignada') ||
       h.has('fecha límite') || h.has('fecha limite') || hNorm.has('fecha limite'))) return 'clickup_es'

  return 'generic'
}

function normalizePriority(raw: string | undefined): ImportedTask['priority'] {
  if (!raw) return 'medium'
  const p = raw.trim().toLowerCase()
  // English
  if (p === 'urgent' || p === 'highest' || p === 'critical') return 'critical'
  if (p === 'high') return 'high'
  if (p === 'medium' || p === 'normal') return 'medium'
  if (p === 'low' || p === 'lowest' || p === 'none' || p === 'no priority') return 'low'
  // Spanish
  if (p === 'urgente' || p === 'crítica' || p === 'critica') return 'critical'
  if (p === 'alta') return 'high'
  if (p === 'media' || p === 'normal') return 'medium'
  if (p === 'baja') return 'low'
  return 'medium'
}

function parseLabels(raw: string | undefined): string[] {
  if (!raw) return []
  return raw.split(/[,;]/).map(s => s.trim()).filter(Boolean)
}

function parseAssignees(raw: string | undefined): string[] {
  if (!raw) return []
  return raw.split(/[,;]/).map(s => s.trim()).filter(Boolean)
}

/**
 * Parse date strings including:
 * - ISO dates (2026-03-13)
 * - US format (3/13/26)
 * - Spanish relative: Hoy, Mañana, Ayer
 * - Spanish abbreviated days: lun., mar., mié., jue., vie., sáb., dom.
 */
function parseDueDate(raw: string | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase().replace(/\./g, '')

  // Spanish relative dates
  const today = new Date()
  if (lower === 'hoy' || lower === 'today') {
    return today.toISOString().split('T')[0]!
  }
  if (lower === 'mañana' || lower === 'manana' || lower === 'tomorrow') {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]!
  }
  if (lower === 'ayer' || lower === 'yesterday') {
    const d = new Date(today)
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]!
  }

  // Spanish abbreviated weekday names → next occurrence
  const spanishDays: Record<string, number> = {
    dom: 0, domingo: 0,
    lun: 1, lunes: 1,
    mar: 2, martes: 2,
    mié: 3, mie: 3, miércoles: 3, miercoles: 3,
    jue: 4, jueves: 4,
    vie: 5, viernes: 5,
    sáb: 6, sab: 6, sábado: 6, sabado: 6,
  }
  const englishDays: Record<string, number> = {
    sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2,
    wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5,
    sat: 6, saturday: 6,
  }
  const allDays = { ...spanishDays, ...englishDays }
  if (allDays[lower] !== undefined) {
    const targetDay = allDays[lower]!
    const d = new Date(today)
    const currentDay = d.getDay()
    let daysUntil = targetDay - currentDay
    if (daysUntil <= 0) daysUntil += 7
    d.setDate(d.getDate() + daysUntil)
    return d.toISOString().split('T')[0]!
  }

  // Try ISO format or common date formats
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]!

  // Try M/D/YY format (US short year)
  const usShort = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (usShort) {
    const year = parseInt(usShort[3]!) + 2000
    const month = parseInt(usShort[1]!) - 1
    const day = parseInt(usShort[2]!)
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]!
  }

  return null
}

function parseEstimate(raw: string | undefined): number | null {
  if (!raw) return null
  const num = parseFloat(raw.trim())
  return isNaN(num) ? null : num
}

// Get a field value trying multiple possible column names (case-insensitive, diacritics-resilient)
function getField(row: CsvRow, ...candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase()
    const candidateNorm = stripDiacritics(candidateLower)
    for (const [key, value] of Object.entries(row)) {
      const keyLower = key.trim().toLowerCase()
      if ((keyLower === candidateLower || stripDiacritics(keyLower) === candidateNorm) && value) {
        return value
      }
    }
  }
  return undefined
}

function mapRow(row: CsvRow, platform: string): ImportedTask {
  switch (platform) {
    case 'linear':
      return {
        title: getField(row, 'Title') || '',
        description: getField(row, 'Description') || null,
        priority: normalizePriority(getField(row, 'Priority')),
        due_date: parseDueDate(getField(row, 'Due Date')),
        tags: parseLabels(getField(row, 'Labels')),
        estimated_hours: parseEstimate(getField(row, 'Estimate')),
        status: getField(row, 'Status') || null,
        assignees: parseAssignees(getField(row, 'Assignee')),
      }

    case 'jira':
      return {
        title: getField(row, 'Summary') || '',
        description: getField(row, 'Description') || null,
        priority: normalizePriority(getField(row, 'Priority')),
        due_date: parseDueDate(getField(row, 'Due Date', 'Due date')),
        tags: parseLabels(getField(row, 'Labels')),
        estimated_hours: null,
        status: getField(row, 'Status') || null,
        assignees: parseAssignees(getField(row, 'Assignee')),
      }

    case 'trello':
      return {
        title: getField(row, 'Card Name') || '',
        description: getField(row, 'Description') || null,
        priority: 'medium',
        due_date: parseDueDate(getField(row, 'Due', 'Due Date')),
        tags: parseLabels(getField(row, 'Labels')),
        estimated_hours: null,
        status: getField(row, 'List') || null,
        assignees: parseAssignees(getField(row, 'Members')),
      }

    case 'clickup':
      return {
        title: getField(row, 'Task Name') || '',
        description: getField(row, 'Description') || null,
        priority: normalizePriority(getField(row, 'Priority')),
        due_date: parseDueDate(getField(row, 'Due Date')),
        tags: parseLabels(getField(row, 'Tags')),
        estimated_hours: parseEstimate(getField(row, 'Estimated Time')),
        status: getField(row, 'Status') || null,
        assignees: parseAssignees(getField(row, 'Assignee', 'Assignees')),
      }

    case 'clickup_es':
      return {
        title: getField(row, 'Nombre', 'Nombre de tarea') || '',
        description: getField(row, 'Descripción', 'Descripcion') || null,
        priority: normalizePriority(getField(row, 'Prioridad')),
        due_date: parseDueDate(getField(row, 'Fecha límite', 'Fecha limite', 'Fecha de vencimiento')),
        tags: parseLabels(getField(row, 'Etiquetas', 'Tags')),
        estimated_hours: parseEstimate(getField(row, 'Tiempo estimado', 'Estimated Time')),
        status: getField(row, 'Estado', 'Status') || null,
        assignees: parseAssignees(getField(row, 'Persona asignada', 'Asignado a', 'Assignee')),
      }

    default: // generic — try both EN + ES field names
      return {
        title: getField(row, 'title', 'name', 'task', 'task name', 'summary', 'nombre', 'nombre de tarea', 'tarea') || '',
        description: getField(row, 'description', 'details', 'body', 'descripción', 'descripcion', 'detalle') || null,
        priority: normalizePriority(getField(row, 'priority', 'prioridad')),
        due_date: parseDueDate(getField(row, 'due_date', 'due date', 'deadline', 'fecha límite', 'fecha limite', 'fecha de vencimiento', 'vencimiento')),
        tags: parseLabels(getField(row, 'tags', 'labels', 'etiquetas')),
        estimated_hours: parseEstimate(getField(row, 'estimate', 'estimated', 'estimated_hours', 'hours', 'tiempo estimado', 'horas')),
        status: getField(row, 'status', 'state', 'column', 'estado', 'columna') || null,
        assignees: parseAssignees(getField(row, 'assignee', 'assignees', 'assigned', 'persona asignada', 'asignado', 'asignado a')),
      }
  }
}

// ── Synonym map for bilingual fuzzy matching ──
const STATUS_SYNONYMS: Record<string, string[]> = {
  'pendiente': ['to do', 'todo', 'por hacer', 'pending', 'pendiente'],
  'en progreso': ['in progress', 'doing', 'in development', 'en desarrollo', 'en progreso', 'en proceso', 'wip'],
  'hecho': ['done', 'completed', 'closed', 'cerrado', 'terminado', 'hecho', 'finalizado'],
  'revision': ['review', 'en review', 'in review', 'revision', 'revisión'],
  'backlog': ['backlog', 'product backlog'],
  'testing': ['qa', 'quality assurance', 'testing', 'testing / qa', 'testing/qa'],
  'staging': ['deploy', 'deployment', 'staging', 'ci/cd', 'deploy / devops', 'deploy/devops'],
  'nuevo': ['new', 'nuevo'],
  'triaje': ['triage', 'triaje'],
  'asignado': ['assigned', 'asignado'],
  'esperando': ['waiting', 'esperando', 'on hold'],
  'code review': ['code review'],
  'produccion': ['produccion', 'producción', 'production'],
  'monitoreo': ['monitoreo', 'monitoring'],
  'sprint backlog': ['sprint backlog'],
  'listo para pull': ['listo para pull', 'ready for pull', 'ready'],
  'archivado': ['archivado', 'archived'],
  'ideas': ['ideas'],
  'planificacion': ['planificacion', 'planificación', 'planning'],
  'creacion': ['creacion', 'creación', 'creation'],
  'aprobado': ['aprobado', 'approved'],
  'publicado': ['publicado', 'published'],
  'analisis': ['analisis', 'análisis', 'analysis'],
  'diseno': ['diseno', 'diseño', 'design'],
  'desarrollo': ['desarrollo', 'development', 'dev'],
  'prompts pendientes': ['prompts pendientes', 'pending prompts'],
  'diseno de agente': ['diseno de agente', 'diseño de agente', 'agent design'],
  'entrenamiento': ['entrenamiento', 'training'],
  'evaluacion': ['evaluacion', 'evaluación', 'evaluation'],
  'diseno de api': ['diseno de api', 'diseño de api', 'api design'],
  'seguridad / rls': ['seguridad / rls', 'seguridad/rls', 'security', 'rls'],
  'inspiracion': ['inspiracion', 'inspiración', 'inspiration'],
  'wireframes': ['wireframes'],
  'diseno ui': ['diseno ui', 'diseño ui', 'ui design'],
  'prototipo': ['prototipo', 'prototype'],
  'desarrollo frontend': ['desarrollo frontend', 'frontend development', 'frontend dev'],
  'review / qa visual': ['review / qa visual', 'review/qa visual', 'visual qa'],
  'integracion': ['integracion', 'integración', 'integration'],
}

// Build reverse lookup: synonym → canonical key
const synonymToCanonical = new Map<string, string>()
for (const [canonical, synonyms] of Object.entries(STATUS_SYNONYMS)) {
  for (const syn of synonyms) {
    synonymToCanonical.set(stripDiacritics(syn.toLowerCase()), canonical)
  }
  synonymToCanonical.set(stripDiacritics(canonical.toLowerCase()), canonical)
}

// Template column signatures (canonical keys from synonym map or direct lowercase+stripped)
const TEMPLATE_SIGNATURES: Record<string, string[]> = {
  simple: ['pendiente', 'en progreso', 'hecho'],
  kanban: ['backlog', 'pendiente', 'en progreso', 'revision', 'hecho'],
  dev: ['backlog', 'analisis', 'desarrollo', 'code review', 'testing', 'produccion'],
  devops: ['backlog', 'diseno', 'desarrollo', 'code review', 'staging', 'staging', 'produccion', 'monitoreo'],
  support: ['nuevo', 'triaje', 'asignado', 'en progreso', 'esperando', 'hecho'],
  scrum: ['backlog', 'sprint backlog', 'en progreso', 'revision', 'testing', 'hecho'],
  scrumban: ['backlog', 'listo para pull', 'en progreso', 'revision', 'testing', 'staging', 'hecho', 'archivado'],
  marketing: ['ideas', 'planificacion', 'creacion', 'revision', 'aprobado', 'publicado', 'analisis'],
  ai_agents: ['prompts pendientes', 'diseno de agente', 'entrenamiento', 'testing', 'evaluacion', 'produccion', 'monitoreo'],
  backend_senior_dev: ['backlog', 'diseno de api', 'desarrollo', 'code review', 'testing', 'seguridad / rls', 'staging', 'produccion', 'monitoreo'],
  frontend_design: ['inspiracion', 'wireframes', 'diseno ui', 'prototipo', 'desarrollo frontend', 'review / qa visual', 'integracion', 'publicado'],
}

function normalizeStatus(status: string): string {
  const stripped = stripDiacritics(status.trim().toLowerCase())
  return synonymToCanonical.get(stripped) || stripped
}

export function suggestTemplate(statuses: string[]): TemplateSuggestion {
  if (statuses.length === 0) {
    return { template: 'simple', score: 0, matchedStatuses: [], unmatchedStatuses: [] }
  }

  const normalizedStatuses = statuses.map(normalizeStatus)
  const uniqueNormalized = new Set(normalizedStatuses)
  let bestTemplate = 'simple'
  let bestScore = 0
  let bestMatched: string[] = []
  let bestUnmatched: string[] = []

  for (const [template, signature] of Object.entries(TEMPLATE_SIGNATURES)) {
    const signatureSet = new Set(signature)
    const matched: string[] = []
    const unmatched: string[] = []

    for (let i = 0; i < normalizedStatuses.length; i++) {
      if (signatureSet.has(normalizedStatuses[i]!)) {
        matched.push(statuses[i]!)
      } else {
        unmatched.push(statuses[i]!)
      }
    }

    // Jaccard similarity: matched / (csv_statuses + template_columns - matched)
    const uniqueCols = signatureSet.size
    const score = matched.length / (uniqueNormalized.size + uniqueCols - matched.length)

    if (score > bestScore) {
      bestScore = score
      bestTemplate = template
      bestMatched = matched
      bestUnmatched = unmatched
    }
  }

  if (bestScore < 0.3) {
    return { template: 'simple', score: bestScore, matchedStatuses: bestMatched, unmatchedStatuses: bestUnmatched }
  }

  return { template: bestTemplate, score: bestScore, matchedStatuses: bestMatched, unmatchedStatuses: bestUnmatched }
}

export function parseImportCsv(csvText: string): ImportResult {
  // Strip BOM, normalize line endings, and trim whitespace
  const cleaned = csvText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  // Let PapaParse auto-detect delimiter (handles both , and ;)
  const result = Papa.parse<CsvRow>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  if (!result.data.length) {
    return { platform: 'unknown', tasks: [] }
  }

  const headers = result.meta.fields || []
  const platform = detectPlatform(headers)

  const tasks = result.data
    .map(row => mapRow(row, platform))
    .filter(t => t.title.trim().length > 0)

  // If no tasks found, log headers for debugging
  if (tasks.length === 0) {
    console.warn('[csvImporter] No tasks found. Headers:', headers, 'Platform:', platform, 'Rows:', result.data.length)
  }

  // Suggest best kanban template based on status values
  const uniqueStatuses = [...new Set(tasks.map(t => t.status).filter((s): s is string => !!s))]
  const suggestedTemplate = uniqueStatuses.length > 0 ? suggestTemplate(uniqueStatuses) : undefined

  return { platform, tasks, suggestedTemplate }
}
