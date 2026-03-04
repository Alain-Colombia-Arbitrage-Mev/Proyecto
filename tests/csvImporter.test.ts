import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseImportCsv, suggestTemplate } from '../server/utils/csvImporter'

describe('parseImportCsv', () => {
  it('returns unknown platform and empty tasks for empty CSV', () => {
    const result = parseImportCsv('')
    expect(result.platform).toBe('unknown')
    expect(result.tasks).toEqual([])
  })

  it('returns empty tasks for headers-only CSV', () => {
    const result = parseImportCsv('Name,Status\n')
    expect(result.tasks).toEqual([])
  })

  // Platform detection
  describe('platform detection', () => {
    it('detects ClickUp ES with Spanish headers', () => {
      const csv = 'Nombre,Persona asignada,Fecha límite,Prioridad\nTarea 1,Juan,2026-04-01,Alta'
      const result = parseImportCsv(csv)
      expect(result.platform).toBe('clickup_es')
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0]!.title).toBe('Tarea 1')
    })

    it('detects Linear by unique headers', () => {
      const csv = 'ID,Title,Estimate,Cycle Number,Priority\nLIN-1,Fix bug,3,12,High'
      const result = parseImportCsv(csv)
      expect(result.platform).toBe('linear')
    })

    it('detects Jira by Issue Key + Summary', () => {
      const csv = 'Issue Key,Summary,Priority,Status\nJIRA-1,Fix it,High,Open'
      const result = parseImportCsv(csv)
      expect(result.platform).toBe('jira')
    })

    it('detects Trello by Card Name + List', () => {
      const csv = 'Card Name,List,Labels\nDo thing,Todo,bug'
      const result = parseImportCsv(csv)
      expect(result.platform).toBe('trello')
    })

    it('detects ClickUp EN by Task Name + Estimated Time', () => {
      const csv = 'Task Name,Estimated Time,Priority\nBuild feature,4h,High'
      const result = parseImportCsv(csv)
      expect(result.platform).toBe('clickup')
    })
  })

  // Priority normalization
  describe('Spanish priority normalization', () => {
    it('maps urgente → critical', () => {
      const csv = 'Nombre,Persona asignada,Prioridad\nTarea,Juan,urgente'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.priority).toBe('critical')
    })

    it('maps alta → high', () => {
      const csv = 'Nombre,Persona asignada,Prioridad\nTarea,Juan,alta'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.priority).toBe('high')
    })

    it('maps baja → low', () => {
      const csv = 'Nombre,Persona asignada,Prioridad\nTarea,Juan,baja'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.priority).toBe('low')
    })

    it('defaults to medium when empty', () => {
      const csv = 'Nombre,Persona asignada,Prioridad\nTarea,Juan,'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.priority).toBe('medium')
    })
  })

  // BOM stripping
  it('strips BOM from CSV', () => {
    const csv = '\uFEFFNombre,Persona asignada,Fecha límite\nTarea BOM,María,2026-05-01'
    const result = parseImportCsv(csv)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]!.title).toBe('Tarea BOM')
  })

  // Empty title rows filtered
  it('filters out rows with empty titles', () => {
    const csv = 'Task Name,Estimated Time,Priority\nReal task,2h,High\n,,Low\n  ,1h,Medium'
    const result = parseImportCsv(csv)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]!.title).toBe('Real task')
  })

  // Diacritics fallback
  it('handles Fecha limite without accent (diacritics fallback)', () => {
    const csv = 'Nombre,Persona asignada,Fecha limite\nTarea,Ana,2026-06-15'
    const result = parseImportCsv(csv)
    expect(result.platform).toBe('clickup_es')
    expect(result.tasks[0]!.due_date).toBe('2026-06-15')
  })

  // Date parsing
  describe('date parsing', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-03T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('parses "hoy" as today', () => {
      const csv = 'Nombre,Persona asignada,Fecha límite\nTarea,Juan,hoy'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.due_date).toBe('2026-03-03')
    })

    it('parses "mañana" as tomorrow', () => {
      const csv = 'Nombre,Persona asignada,Fecha límite\nTarea,Juan,mañana'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.due_date).toBe('2026-03-04')
    })

    it('parses ISO date', () => {
      const csv = 'Nombre,Persona asignada,Fecha límite\nTarea,Juan,2026-12-25'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.due_date).toBe('2026-12-25')
    })

    it('parses US short date M/D/YY', () => {
      const csv = 'Task Name,Estimated Time,Due Date\nTask,2h,3/15/26'
      const result = parseImportCsv(csv)
      expect(result.tasks[0]!.due_date).toBe('2026-03-15')
    })
  })

  // Quoted CSV fields with internal commas
  it('handles quoted fields with internal commas', () => {
    const csv = 'Task Name,Estimated Time,Description\n"Task with, comma",2h,"A long, detailed description"'
    const result = parseImportCsv(csv)
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]!.title).toBe('Task with, comma')
    expect(result.tasks[0]!.description).toBe('A long, detailed description')
  })

  // suggestedTemplate integration via parseImportCsv
  it('includes suggestedTemplate when CSV has status column', () => {
    const csv = 'Title,Status\nTask 1,Backlog\nTask 2,In Progress\nTask 3,Done'
    const result = parseImportCsv(csv)
    expect(result.suggestedTemplate).toBeDefined()
    expect(result.suggestedTemplate!.template).toBeTruthy()
    expect(result.suggestedTemplate!.score).toBeGreaterThan(0)
  })

  it('does not include suggestedTemplate when no status values', () => {
    const csv = 'Title,Description\nTask 1,Some desc'
    const result = parseImportCsv(csv)
    expect(result.suggestedTemplate).toBeUndefined()
  })
})

describe('suggestTemplate', () => {
  it('suggests simple or kanban for ["To Do", "In Progress", "Done"]', () => {
    const result = suggestTemplate(['To Do', 'In Progress', 'Done'])
    expect(['simple', 'kanban']).toContain(result.template)
    expect(result.score).toBeGreaterThanOrEqual(0.3)
  })

  it('suggests scrum for ["Product Backlog", "Sprint Backlog", "In Progress", "Done"]', () => {
    const result = suggestTemplate(['Product Backlog', 'Sprint Backlog', 'In Progress', 'Done'])
    expect(result.template).toBe('scrum')
    expect(result.score).toBeGreaterThanOrEqual(0.3)
  })

  it('suggests dev for ["Backlog", "Dev", "Code Review", "QA", "Producción"]', () => {
    const result = suggestTemplate(['Backlog', 'Dev', 'Code Review', 'QA', 'Producción'])
    expect(result.template).toBe('dev')
    expect(result.score).toBeGreaterThanOrEqual(0.3)
  })

  it('suggests scrumban for ["Backlog", "In Progress", "Review", "Testing", "Deploy", "Done"]', () => {
    const result = suggestTemplate(['Backlog', 'In Progress', 'Review', 'Testing', 'Deploy', 'Done'])
    expect(result.template).toBe('scrumban')
    expect(result.score).toBeGreaterThanOrEqual(0.3)
  })

  it('suggests marketing for ["Ideas", "Creación", "Revisión", "Publicado"]', () => {
    const result = suggestTemplate(['Ideas', 'Creación', 'Revisión', 'Publicado'])
    expect(result.template).toBe('marketing')
    expect(result.score).toBeGreaterThanOrEqual(0.3)
  })

  it('suggests support for ["Nuevo", "Triaje", "Asignado", "Cerrado"]', () => {
    const result = suggestTemplate(['Nuevo', 'Triaje', 'Asignado', 'Cerrado'])
    expect(result.template).toBe('support')
    expect(result.score).toBeGreaterThanOrEqual(0.3)
  })

  it('defaults to simple for empty statuses', () => {
    const result = suggestTemplate([])
    expect(result.template).toBe('simple')
    expect(result.score).toBe(0)
  })

  it('defaults to simple for unrecognized statuses', () => {
    const result = suggestTemplate(['random', 'unknown', 'stuff'])
    expect(result.template).toBe('simple')
    expect(result.score).toBeLessThan(0.3)
  })

  it('handles EN synonyms: ["Backlog", "Doing", "Review", "QA", "Done"]', () => {
    const result = suggestTemplate(['Backlog', 'Doing', 'Review', 'QA', 'Done'])
    expect(['kanban', 'scrum']).toContain(result.template)
    expect(result.score).toBeGreaterThanOrEqual(0.3)
  })

  it('tracks matched and unmatched statuses', () => {
    const result = suggestTemplate(['Backlog', 'In Progress', 'Done', 'CustomColumn'])
    expect(result.matchedStatuses.length).toBeGreaterThan(0)
    expect(result.unmatchedStatuses).toContain('CustomColumn')
  })
})
