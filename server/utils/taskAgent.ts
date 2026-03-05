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
    maxTokens: 12288,
    tags: ['sprint', 'planificación', 'priorización'],
  },
  agent_task_generator: {
    action: 'agent_task_generator',
    name: 'Task Generator (Context7)',
    description: 'Genera tareas técnicas detalladas usando documentación real de librerías vía Context7. Ideal para features complejas.',
    icon: 'i-heroicons-queue-list',
    color: '#0EA5E9',
    agentType: 'task_generator',
    maxTokens: 16384,
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
    maxTokens: 16384,
    tags: ['mejora', 'calidad', 'estimación'],
  },
}

export function isTaskAgentAction(action: string): boolean {
  return action in TASK_AGENTS
}

export function getTaskAgentConfig(action: string): TaskAgentConfig | null {
  return TASK_AGENTS[action] || null
}

// Shared description format injected into every task-producing prompt
const DESC_FORMAT = `
Cada "description" DEBE incluir (markdown):
## Objetivo
1 línea: qué se logra.
## Pasos de implementación
1. Paso con archivo/función específica (mín. 4, máx. 10)
## Archivos involucrados
- \`ruta/archivo\` — cambio
## Criterios de aceptación
- ✅ criterio verificable
## Notas técnicas
Dependencias, edge cases, seguridad/performance.`

// Shared bilingual requirement appended once at the end
const BILINGUAL = `
BILINGÜE: todo campo "title"/"description" necesita su par "_en" (traducción exacta al inglés).`

const basePrompts: Record<string, string> = {
  agent_sprint_planner: `Eres un Scrum Master senior. Analiza las tareas actuales y genera un plan de sprint optimizado.

Responde en JSON:
- "sprint_name": string
- "sprint_goal": string (1-2 líneas)
- "duration_days": number (7, 10 o 14)
- "analysis": string (estado actual breve)
- "prioritized_existing": { "task_id": string, "title": string, "recommended_priority": "low"|"medium"|"high"|"critical", "reason": string }[]
- "new_tasks": { "title": string, "title_en": string, "description": string, "description_en": string, "priority": "low"|"medium"|"high"|"critical", "tags": string[], "estimated_hours": number }[] (3-5 tareas)
- "risks": string[]
- "velocity_estimate": number
${DESC_FORMAT}`,

  agent_task_generator: `Eres un tech lead senior. Usa la documentación proporcionada para generar tareas técnicas accionables.

Responde en JSON:
- "feature_summary": string
- "tasks": { "title": string, "title_en": string, "description": string, "description_en": string, "priority": "low"|"medium"|"high"|"critical", "tags": string[], "estimated_hours": number, "acceptance_criteria": string[] }[] (8-12 tareas)
- "dependencies": { "task_index": number, "depends_on": number[] }[]
- "tech_notes": string
${DESC_FORMAT}
Incluye snippets de código de referencia en ## Código de referencia dentro de cada description.`,

  agent_workload_analyzer: `Eres un Project Manager senior. Analiza distribución de carga, cuellos de botella y desbalances del equipo.

Responde en JSON:
- "summary": string
- "health_score": number (1-100)
- "bottlenecks": { "area": string, "description": string, "severity": "low"|"medium"|"high" }[]
- "stale_tasks": { "task_id": string, "title": string, "days_stale": number, "recommendation": string }[]
- "member_load": { "member_id": string, "assigned_count": number, "total_hours": number, "status": "underloaded"|"balanced"|"overloaded" }[]
- "recommendations": { "action": string, "description": string, "priority": "low"|"medium"|"high" }[]
- "suggested_reassignments": { "task_id": string, "title": string, "from_member": string, "to_member": string, "reason": string }[]`,

  agent_task_improver: `Eres un experto en calidad ágil. Mejora títulos, descripciones y estimaciones de las tareas existentes.

Responde en JSON:
- "summary": string
- "improvements": { "task_id": string, "original_title": string, "improved_title": string, "improved_description": string, "improved_title_en": string, "improved_description_en": string, "suggested_priority": "low"|"medium"|"high"|"critical", "suggested_estimated_hours": number, "suggested_tags": string[], "quality_before": number, "quality_after": number }[]
- "overall_quality_before": number (1-10)
- "overall_quality_after": number (1-10)
- "missing_tasks": { "title": string, "title_en": string, "description": string, "description_en": string, "priority": string, "tags": string[], "estimated_hours": number }[]
${DESC_FORMAT}
Aplica el mismo formato a "improved_description" y a cada "missing_tasks[].description".`,
}

export function buildTaskAgentSystemPrompt(
  config: TaskAgentConfig,
  projectContext: string,
  extraContext?: string,
): string {
  let prompt = basePrompts[config.action] || ''
  prompt += BILINGUAL
  prompt += `\n\n${projectContext}`
  prompt += `\n\nSé específico y técnico. Basa tu análisis en los datos reales del proyecto.
Responde SOLO con el JSON object, sin markdown ni texto extra. No uses <think> tags.`

  if (extraContext) {
    prompt += `\n\nDocumentación de librerías/frameworks:\n${extraContext}`
  }

  return prompt
}
