import { describe, expect, it } from 'vitest'
import { inferAdvisorAgent, normalizeAdvisorAutomation } from '../server/utils/advisorAutomation'

const projects = [
  {
    id: 'project-1',
    name: 'FocusFlow',
    owner_id: 'owner-1',
    columns: [
      { id: 'todo', title: 'Por hacer', position: 0 },
      { id: 'doing', title: 'En progreso', position: 1 },
    ],
  },
]

describe('normalizeAdvisorAutomation', () => {
  it('validates project and column, then falls back to project owner assignee', () => {
    const result = normalizeAdvisorAutomation({
      reply: 'Listo.',
      analysis: { intent: 'create_tasks', should_create_tasks: true, confidence: 0.9 },
      tasks: [{
        project_id: 'project-1',
        column: 'En progreso',
        title: 'Crear endpoint de automatizacion',
        description: 'Implementar endpoint y criterios de aceptacion.',
        priority: 'high',
        estimated_hours: 2.5,
        ai_agent: 'backend',
        assignee_id: 'missing-user',
        tags: ['advisor', 'backend', 'backend'],
      }],
    }, {
      projects,
      validAssigneeIds: ['owner-1', 'user-1'],
      reporterId: 'user-1',
    })

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]!.project_id).toBe('project-1')
    expect(result.tasks[0]!.column_id).toBe('doing')
    expect(result.tasks[0]!.assignees).toEqual(['owner-1'])
    expect(result.tasks[0]!.tags).toEqual(['advisor', 'backend'])
  })

  it('does not create tasks when analysis explicitly says not to', () => {
    const result = normalizeAdvisorAutomation({
      reply: 'Solo es una consulta.',
      analysis: { intent: 'question', should_create_tasks: false, confidence: 0.8 },
      tasks: [{ project_id: 'project-1', title: 'No crear' }],
    }, {
      projects,
      validAssigneeIds: ['owner-1'],
      reporterId: 'owner-1',
    })

    expect(result.tasks).toEqual([])
    expect(result.analysis.should_create_tasks).toBe(false)
  })

  it('infers an agent when the model returns an invalid agent type', () => {
    const result = normalizeAdvisorAutomation({
      reply: 'Creo la tarea.',
      analysis: { intent: 'delegate', should_create_tasks: true, confidence: 1 },
      tasks: [{
        project_id: 'project-1',
        title: 'Auditar RLS y permisos del workspace',
        description: 'Revisar seguridad, auth y permisos.',
        ai_agent: 'unknown',
      }],
    }, {
      projects,
      validAssigneeIds: ['owner-1'],
      reporterId: 'owner-1',
    })

    expect(result.tasks[0]!.ai_agent).toBe('security')
  })
})

describe('inferAdvisorAgent', () => {
  it('handles accented Spanish keywords', () => {
    expect(inferAdvisorAgent({ title: 'Preparar deploy a producción' })).toBe('devops')
    expect(inferAdvisorAgent({ title: 'Diseño responsive de la pantalla' })).toBe('frontend')
  })
})
