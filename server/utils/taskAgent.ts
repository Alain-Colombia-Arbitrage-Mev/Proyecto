export interface TaskAgentConfig {
  action: string
  name: string
  description: string
  icon: string
  color: string
  agentType: string
  maxTokens: number
  tags: string[]
}

/** Registry of all task management agents */
export const TASK_AGENTS: Record<string, TaskAgentConfig> = {
  agent_sprint_planner: {
    action: 'agent_sprint_planner',
    name: 'Sprint Planner',
    description: 'Analiza tareas existentes, prioriza y genera un plan de sprint con tareas organizadas por columnas y prioridad.',
    icon: 'i-heroicons-calendar-days',
    color: '#6366F1',
    agentType: 'sprint_planner',
    maxTokens: 8192,
    tags: ['sprint', 'planificación', 'priorización'],
  },
  agent_task_generator: {
    action: 'agent_task_generator',
    name: 'Task Generator (Context7)',
    description: 'Genera tareas técnicas detalladas usando documentación real de librerías vía Context7. Ideal para features complejas.',
    icon: 'i-heroicons-queue-list',
    color: '#0EA5E9',
    agentType: 'task_generator',
    maxTokens: 8192,
    tags: ['tareas', 'generación', 'context7'],
  },
  agent_workload_analyzer: {
    action: 'agent_workload_analyzer',
    name: 'Workload Analyzer',
    description: 'Analiza la distribución de carga de trabajo, detecta cuellos de botella, tareas estancadas y desbalances entre miembros.',
    icon: 'i-heroicons-chart-bar',
    color: '#F97316',
    agentType: 'workload_analyzer',
    maxTokens: 8192,
    tags: ['análisis', 'carga', 'equipo'],
  },
  agent_task_improver: {
    action: 'agent_task_improver',
    name: 'Bulk Task Improver',
    description: 'Mejora títulos, descripciones y estimaciones de todas las tareas del proyecto. Agrega criterios de aceptación.',
    icon: 'i-heroicons-arrow-trending-up',
    color: '#14B8A6',
    agentType: 'task_improver',
    maxTokens: 12288,
    tags: ['mejora', 'calidad', 'estimación'],
  },
}

export function isTaskAgentAction(action: string): boolean {
  return action in TASK_AGENTS
}

export function getTaskAgentConfig(action: string): TaskAgentConfig | null {
  return TASK_AGENTS[action] || null
}

export function buildTaskAgentSystemPrompt(
  config: TaskAgentConfig,
  projectContext: string,
  extraContext?: string,
): string {
  const basePrompts: Record<string, string> = {
    agent_sprint_planner: `Eres un Scrum Master senior experto en planificación de sprints y priorización de tareas.
Analiza las tareas actuales del proyecto y genera un plan de sprint optimizado.

Responde en JSON con:
- "sprint_name": string (nombre del sprint, ej: "Sprint 12 - Auth & Payments")
- "sprint_goal": string (objetivo principal del sprint en 1-2 líneas)
- "duration_days": number (duración recomendada: 7, 10 o 14 días)
- "analysis": string (análisis breve del estado actual del proyecto)
- "prioritized_existing": array de { "task_id": string, "title": string, "recommended_priority": "low"|"medium"|"high"|"critical", "reason": string } (tareas existentes reordenadas por prioridad)
- "new_tasks": array de { "title": string, "description": string, "priority": "low"|"medium"|"high"|"critical", "tags": string[], "estimated_hours": number } (3-5 nuevas tareas que faltan para completar el sprint goal)
- "risks": string[] (riesgos del sprint)
- "velocity_estimate": number (story points o horas totales estimadas)`,

    agent_task_generator: `Eres un tech lead senior que genera tareas técnicas detalladas y accionables.
Usa la documentación real de frameworks y librerías proporcionada para generar tareas específicas con código de referencia.

Responde en JSON con:
- "feature_summary": string (resumen de las features que cubren las tareas)
- "tasks": array de { "title": string, "description": string, "priority": "low"|"medium"|"high"|"critical", "tags": string[], "estimated_hours": number, "acceptance_criteria": string[] } (8-12 tareas técnicas detalladas)
- "dependencies": array de { "task_index": number, "depends_on": number[] } (dependencias entre tareas)
- "tech_notes": string (notas técnicas relevantes basadas en la documentación)

Cada tarea debe ser:
- Específica y ejecutable (no genérica)
- Con criterios de aceptación claros
- Con estimación realista en horas
- Etiquetada con tags técnicos relevantes`,

    agent_workload_analyzer: `Eres un Project Manager senior experto en análisis de carga de trabajo y optimización de equipos.
Analiza las tareas del proyecto, su distribución entre miembros y estado actual.

Responde en JSON con:
- "summary": string (resumen ejecutivo del estado de carga)
- "health_score": number (1-100, donde 100 = equipo saludable y balanceado)
- "bottlenecks": array de { "area": string, "description": string, "severity": "low"|"medium"|"high" } (cuellos de botella detectados)
- "stale_tasks": array de { "task_id": string, "title": string, "days_stale": number, "recommendation": string } (tareas estancadas sin movimiento)
- "member_load": array de { "member_id": string, "assigned_count": number, "total_hours": number, "status": "underloaded"|"balanced"|"overloaded" } (carga por miembro)
- "recommendations": array de { "action": string, "description": string, "priority": "low"|"medium"|"high" } (acciones recomendadas)
- "suggested_reassignments": array de { "task_id": string, "title": string, "from_member": string, "to_member": string, "reason": string } (reasignaciones sugeridas)`,

    agent_task_improver: `Eres un experto en calidad de tareas y gestión ágil. Tu trabajo es mejorar la claridad y completitud de las tareas existentes.
Analiza cada tarea y genera versiones mejoradas con títulos más claros, descripciones detalladas y criterios de aceptación.

Responde en JSON con:
- "summary": string (resumen de mejoras aplicadas)
- "improvements": array de {
    "task_id": string,
    "original_title": string,
    "improved_title": string,
    "improved_description": string (incluir criterios de aceptación como checklist markdown),
    "suggested_priority": "low"|"medium"|"high"|"critical",
    "suggested_estimated_hours": number,
    "suggested_tags": string[],
    "quality_before": number (1-10),
    "quality_after": number (1-10)
  }
- "overall_quality_before": number (promedio 1-10)
- "overall_quality_after": number (promedio 1-10)
- "missing_tasks": array de { "title": string, "description": string, "priority": string, "tags": string[], "estimated_hours": number } (tareas que faltan basándose en gaps detectados)`,
  }

  let prompt = basePrompts[config.action] || ''
  prompt += `\n\n${projectContext}`
  prompt += `\n\nSé específico y técnico. Basa tu análisis en los datos reales del proyecto.
Responde SOLO con el JSON object, sin markdown ni texto extra. No uses <think> tags.`

  if (extraContext) {
    prompt += `\n\nDocumentación de librerías/frameworks:\n${extraContext}`
  }

  return prompt
}
