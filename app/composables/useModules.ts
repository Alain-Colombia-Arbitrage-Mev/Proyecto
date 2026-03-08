/**
 * Module toggle system — each workspace can enable/disable features.
 * Stored in workspace.ai_config.modules as { [key]: boolean }.
 * Modules not listed default to true (enabled).
 */

export interface ModuleDef {
  key: string
  labelEn: string
  labelEs: string
  icon: string
  description_en: string
  description_es: string
  default: boolean
  core?: boolean // core modules can't be disabled
}

export const MODULE_DEFINITIONS: ModuleDef[] = [
  { key: 'dashboard', labelEn: 'Dashboard', labelEs: 'Dashboard', icon: 'i-heroicons-squares-2x2', description_en: 'Main overview', description_es: 'Vista general', default: true, core: true },
  { key: 'projects', labelEn: 'Projects', labelEs: 'Proyectos', icon: 'i-heroicons-folder-open', description_en: 'Project management & Kanban boards', description_es: 'Gestion de proyectos y tableros Kanban', default: true, core: true },
  { key: 'ai_agents', labelEn: 'AI Agents', labelEs: 'Agentes AI', icon: 'i-heroicons-cpu-chip', description_en: 'AI-powered task delegation', description_es: 'Delegacion de tareas con AI', default: true },
  { key: 'orchestrator', labelEn: 'Orchestrator', labelEs: 'Orquestador', icon: 'i-heroicons-sparkles', description_en: 'AI task decomposition & orchestration', description_es: 'Descomposicion y orquestacion de tareas con AI', default: true },
  { key: 'workflows', labelEn: 'Workflows', labelEs: 'Flujos de trabajo', icon: 'i-heroicons-bolt', description_en: 'Automation workflows', description_es: 'Flujos de automatizacion', default: true },
  { key: 'timesheet', labelEn: 'Timesheet', labelEs: 'Registro de horas', icon: 'i-heroicons-clock', description_en: 'Time tracking & reports', description_es: 'Seguimiento de tiempo y reportes', default: true },
  { key: 'files', labelEn: 'Files', labelEs: 'Archivos', icon: 'i-heroicons-document-duplicate', description_en: 'File management', description_es: 'Gestion de archivos', default: true },
  { key: 'goals', labelEn: 'Goals', labelEs: 'Objetivos', icon: 'i-heroicons-flag', description_en: 'OKRs & goal tracking', description_es: 'OKRs y seguimiento de metas', default: true },
  { key: 'roadmap', labelEn: 'Roadmap', labelEs: 'Roadmap', icon: 'i-heroicons-map', description_en: 'Product roadmap & timeline', description_es: 'Hoja de ruta del producto', default: true },
  { key: 'agenda', labelEn: 'Agenda', labelEs: 'Agenda', icon: 'i-heroicons-calendar-days', description_en: 'Meetings & calendar', description_es: 'Reuniones y calendario', default: true },
  { key: 'billing', labelEn: 'Billing', labelEs: 'Facturacion', icon: 'i-heroicons-credit-card', description_en: 'Plans & billing', description_es: 'Planes y facturacion', default: true },
  { key: 'integrations', labelEn: 'MCP / API', labelEs: 'MCP / API', icon: 'i-heroicons-puzzle-piece', description_en: 'MCP server & API tokens', description_es: 'Servidor MCP y tokens API', default: true },
]

export function useModules() {
  const store = useWorkspaceStore()

  const modules = computed(() => {
    const config = (store.workspace?.ai_config as Record<string, any>) || {}
    return (config.modules || {}) as Record<string, boolean>
  })

  function isEnabled(key: string): boolean {
    const def = MODULE_DEFINITIONS.find(m => m.key === key)
    if (def?.core) return true
    const val = modules.value[key]
    // If not set, use default
    if (val === undefined) return def?.default ?? true
    return val
  }

  const enabledModules = computed(() => {
    return MODULE_DEFINITIONS.filter(m => isEnabled(m.key))
  })

  async function toggleModule(key: string, enabled: boolean) {
    if (!store.workspace) return
    const def = MODULE_DEFINITIONS.find(m => m.key === key)
    if (def?.core) return // can't disable core modules

    const config = { ...((store.workspace.ai_config as Record<string, any>) || {}) }
    if (!config.modules) config.modules = {}
    config.modules[key] = enabled

    await $fetch(`/api/workspaces/${store.workspace.id}`, {
      method: 'PATCH',
      body: { ai_config: config },
    })

    // Update local store
    store.workspace = { ...store.workspace, ai_config: config }
  }

  return { modules, isEnabled, enabledModules, toggleModule, definitions: MODULE_DEFINITIONS }
}
