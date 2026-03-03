import Papa from 'papaparse'

export interface ImportedTask {
  title: string
  description: string | null
  priority: 'critical' | 'high' | 'medium' | 'low'
  due_date: string | null
  tags: string[]
  estimated_hours: number | null
  status: string | null
}

export interface ImportResult {
  platform: string
  tasks: ImportedTask[]
}

type CsvRow = Record<string, string>

// Header signatures for auto-detection
function detectPlatform(headers: string[]): string {
  const h = new Set(headers.map(s => s.trim().toLowerCase()))

  if (h.has('id') && h.has('estimate') && h.has('cycle number')) return 'linear'
  if (h.has('issue key') && h.has('summary')) return 'jira'
  if ((h.has('card name') || h.has('card id')) && h.has('list')) return 'trello'
  if (h.has('task name') && h.has('estimated time')) return 'clickup'

  return 'generic'
}

function normalizePriority(raw: string | undefined): ImportedTask['priority'] {
  if (!raw) return 'medium'
  const p = raw.trim().toLowerCase()
  if (p === 'urgent' || p === 'highest' || p === 'critical') return 'critical'
  if (p === 'high') return 'high'
  if (p === 'medium' || p === 'normal') return 'medium'
  if (p === 'low' || p === 'lowest' || p === 'none' || p === 'no priority') return 'low'
  return 'medium'
}

function parseLabels(raw: string | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function parseDueDate(raw: string | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Try ISO format or common date formats
  const date = new Date(trimmed)
  if (isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]!
}

function parseEstimate(raw: string | undefined): number | null {
  if (!raw) return null
  const num = parseFloat(raw.trim())
  return isNaN(num) ? null : num
}

// Get a field value trying multiple possible column names (case-insensitive)
function getField(row: CsvRow, ...candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    for (const [key, value] of Object.entries(row)) {
      if (key.trim().toLowerCase() === candidate.toLowerCase() && value) {
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
      }

    default: // generic
      return {
        title: getField(row, 'title', 'name', 'task', 'task name', 'summary') || '',
        description: getField(row, 'description', 'details', 'body') || null,
        priority: normalizePriority(getField(row, 'priority')),
        due_date: parseDueDate(getField(row, 'due_date', 'due date', 'deadline')),
        tags: parseLabels(getField(row, 'tags', 'labels')),
        estimated_hours: parseEstimate(getField(row, 'estimate', 'estimated', 'estimated_hours', 'hours')),
        status: getField(row, 'status', 'state', 'column') || null,
      }
  }
}

export function parseImportCsv(csvText: string): ImportResult {
  const result = Papa.parse<CsvRow>(csvText, {
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

  return { platform, tasks }
}
