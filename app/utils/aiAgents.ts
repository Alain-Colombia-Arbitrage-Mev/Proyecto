/**
 * Client-side registry of FocusFlow AI agents with roles and specialties.
 * Must stay in sync with server/utils/agentAI.ts AGENT_REGISTRY.
 */
export interface AIAgentInfo {
  type: string
  emoji: string
  name: string
  nameEn: string
  specialty: string
  specialtyEn: string
  color: string
}

export const AI_AGENTS: AIAgentInfo[] = [
  { type: 'backend', emoji: '⚙️', name: 'Backend Dev', nameEn: 'Backend Dev', specialty: 'APIs, bases de datos, lógica de negocio', specialtyEn: 'APIs, databases, business logic', color: '#3B82F6' },
  { type: 'frontend', emoji: '🎨', name: 'Frontend Dev', nameEn: 'Frontend Dev', specialty: 'UI, componentes, estado, responsive', specialtyEn: 'UI, components, state, responsive', color: '#8B5CF6' },
  { type: 'qa', emoji: '🧪', name: 'QA Engineer', nameEn: 'QA Engineer', specialty: 'Planes de prueba, revisión de calidad', specialtyEn: 'Test plans, quality review', color: '#F97316' },
  { type: 'devops', emoji: '🚀', name: 'DevOps', nameEn: 'DevOps', specialty: 'CI/CD, deploy, infraestructura', specialtyEn: 'CI/CD, deploy, infrastructure', color: '#14B8A6' },
  { type: 'designer', emoji: '✏️', name: 'Designer', nameEn: 'Designer', specialty: 'Diseño UI/UX, wireframes, prototipos', specialtyEn: 'UI/UX design, wireframes, prototypes', color: '#EC4899' },
  { type: 'copywriter', emoji: '✍️', name: 'Copywriter', nameEn: 'Copywriter', specialty: 'Textos de marketing, headlines, CTAs', specialtyEn: 'Marketing copy, headlines, CTAs', color: '#F59E0B' },
  { type: 'content_creator', emoji: '📹', name: 'Content Creator', nameEn: 'Content Creator', specialty: 'Artículos, posts, guiones, contenido', specialtyEn: 'Articles, posts, scripts, content', color: '#EF4444' },
  { type: 'data', emoji: '📊', name: 'Data Analyst', nameEn: 'Data Analyst', specialty: 'Análisis de datos, métricas, reporting', specialtyEn: 'Data analysis, metrics, reporting', color: '#6366F1' },
  { type: 'security', emoji: '🔐', name: 'Especialista Seguridad', nameEn: 'Security Specialist', specialty: 'Auditoría de seguridad, OWASP, permisos', specialtyEn: 'Security audit, OWASP, permissions', color: '#DC2626' },
  { type: 'seo', emoji: '🔎', name: 'Especialista SEO', nameEn: 'SEO Specialist', specialty: 'SEO técnico, keywords, Core Web Vitals', specialtyEn: 'Technical SEO, keywords, Core Web Vitals', color: '#10B981' },
  { type: 'planner', emoji: '🗺️', name: 'Auto Planner', nameEn: 'Auto Planner', specialty: 'Descompone objetivos en tareas y sprints', specialtyEn: 'Decomposes goals into tasks and sprints', color: '#0EA5E9' },
  { type: 'reviewer', emoji: '⭐', name: 'Quality Reviewer', nameEn: 'Quality Reviewer', specialty: 'Mejora de tareas y revisión de entregables', specialtyEn: 'Task improvement and deliverable review', color: '#A855F7' },
  { type: 'orchestrator', emoji: '🎯', name: 'Orchestrator', nameEn: 'Orchestrator', specialty: 'Coordina agentes y asigna trabajo', specialtyEn: 'Coordinates agents and assigns work', color: '#0891B2' },
]
