/**
 * Client-side RBAC permission system — mirrors server/utils/permissions.ts
 * Supports workspace-level overrides stored in workspace.ai_config.role_permissions
 */

type Permission =
  | 'view_tasks'
  | 'create_tasks'
  | 'edit_tasks'
  | 'delete_tasks'
  | 'import_tasks'
  | 'view_files'
  | 'upload_files'
  | 'delete_files'
  | 'use_ai_basic'
  | 'use_ai_doc_agents'
  | 'view_meetings'
  | 'create_meetings'
  | 'manage_labels'
  | 'delete_labels'
  | 'manage_members'
  | 'view_usage_stats'
  | 'manage_workspace'
  | 'manage_comments'
  | 'view_timesheets'
  | 'manage_timesheets'
  | 'view_reports'
  | 'manage_sprints'
  | 'view_goals'
  | 'manage_goals'
  | 'view_roadmap'

export const ALL_PERMISSIONS: Permission[] = [
  'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'import_tasks',
  'view_files', 'upload_files', 'delete_files',
  'use_ai_basic', 'use_ai_doc_agents',
  'view_meetings', 'create_meetings',
  'manage_labels', 'delete_labels',
  'manage_members', 'view_usage_stats', 'manage_workspace',
  'manage_comments', 'view_timesheets', 'manage_timesheets',
  'view_reports', 'manage_sprints', 'view_goals', 'manage_goals', 'view_roadmap',
]

export const ALL_ROLES = ['viewer', 'marketing', 'member', 'admin', 'owner', 'superadmin'] as const

const ROLE_LEVELS: Record<string, number> = {
  viewer: 0,
  marketing: 1,
  member: 1,
  admin: 2,
  owner: 3,
  superadmin: 4,
}

const DEFAULT_PERMISSION_MIN_ROLE: Record<Permission, number> = {
  view_tasks: 0,
  create_tasks: 1,
  edit_tasks: 1,
  delete_tasks: 1,
  import_tasks: 2,
  view_files: 0,
  upload_files: 1,
  delete_files: 2,
  use_ai_basic: 1,
  use_ai_doc_agents: 2,
  view_meetings: 0,
  create_meetings: 1,
  manage_labels: 1,
  delete_labels: 2,
  manage_members: 2,
  view_usage_stats: 2,
  manage_workspace: 3,
  manage_comments: 1,
  view_timesheets: 0,
  manage_timesheets: 2,
  view_reports: 0,
  manage_sprints: 2,
  view_goals: 0,
  manage_goals: 2,
  view_roadmap: 0,
}

const MARKETING_DEFAULT_PERMISSIONS: Permission[] = [
  'view_tasks', 'create_tasks', 'edit_tasks',
  'view_files', 'upload_files',
  'view_meetings', 'create_meetings',
  'manage_labels',
]

const AI_PERMISSIONS = new Set<Permission>([
  'use_ai_basic',
  'use_ai_doc_agents',
])

type RolePermissionOverrides = Record<string, Record<string, boolean>>

export const PERMISSION_LABELS: Record<Permission, { en: string; es: string }> = {
  view_tasks: { en: 'View tasks', es: 'Ver tareas' },
  create_tasks: { en: 'Create tasks', es: 'Crear tareas' },
  edit_tasks: { en: 'Edit tasks', es: 'Editar tareas' },
  delete_tasks: { en: 'Delete tasks', es: 'Eliminar tareas' },
  import_tasks: { en: 'Import tasks', es: 'Importar tareas' },
  view_files: { en: 'View files', es: 'Ver archivos' },
  upload_files: { en: 'Upload files', es: 'Subir archivos' },
  delete_files: { en: 'Delete files', es: 'Eliminar archivos' },
  use_ai_basic: { en: 'Use AI (basic)', es: 'Usar AI (básico)' },
  use_ai_doc_agents: { en: 'Use AI doc agents', es: 'Usar agentes AI docs' },
  view_meetings: { en: 'View meetings', es: 'Ver reuniones' },
  create_meetings: { en: 'Create meetings', es: 'Crear reuniones' },
  manage_labels: { en: 'Manage labels', es: 'Gestionar etiquetas' },
  delete_labels: { en: 'Delete labels', es: 'Eliminar etiquetas' },
  manage_members: { en: 'Manage members', es: 'Gestionar miembros' },
  view_usage_stats: { en: 'View usage stats', es: 'Ver estadísticas' },
  manage_workspace: { en: 'Manage workspace', es: 'Gestionar workspace' },
  manage_comments: { en: 'Manage comments', es: 'Gestionar comentarios' },
  view_timesheets: { en: 'View timesheets', es: 'Ver hojas de tiempo' },
  manage_timesheets: { en: 'Manage timesheets', es: 'Gestionar hojas de tiempo' },
  view_reports: { en: 'View reports', es: 'Ver reportes' },
  manage_sprints: { en: 'Manage sprints', es: 'Gestionar sprints' },
  view_goals: { en: 'View goals', es: 'Ver objetivos' },
  manage_goals: { en: 'Manage goals', es: 'Gestionar objetivos' },
  view_roadmap: { en: 'View roadmap', es: 'Ver roadmap' },
}

function hasPermissionCheck(
  role: string,
  permission: Permission,
  overrides?: RolePermissionOverrides,
  aiEnabled?: boolean,
): boolean {
  if (role === 'superadmin') return true

  // AI permissions need ai_enabled
  if (AI_PERMISSIONS.has(permission) && !aiEnabled) return false

  // Check workspace-level override
  if (overrides?.[role]?.[permission] !== undefined) {
    return overrides[role][permission]
  }

  // Marketing role: restricted by default
  if (role === 'marketing') {
    return MARKETING_DEFAULT_PERMISSIONS.includes(permission)
  }

  // Default role-level check
  const userLevel = ROLE_LEVELS[role] ?? 0
  const required = DEFAULT_PERMISSION_MIN_ROLE[permission] ?? 0
  return userLevel >= required
}

export function getRolePermissions(
  role: string,
  overrides?: RolePermissionOverrides,
): Record<Permission, boolean> {
  const result = {} as Record<Permission, boolean>
  for (const perm of ALL_PERMISSIONS) {
    result[perm] = hasPermissionCheck(role, perm, overrides, true)
  }
  return result
}

export function usePermissions() {
  const auth = useAuthStore()
  const workspaceStore = useWorkspaceStore()

  const overrides = computed(() => {
    const cfg = (workspaceStore.workspace as any)?.ai_config
    return cfg?.role_permissions as RolePermissionOverrides | undefined
  })

  function can(permission: Permission): boolean {
    const role = auth.role
    if (role === 'superadmin' || auth.isPlatformAdmin) return true
    return hasPermissionCheck(
      role,
      permission,
      overrides.value,
      workspaceStore.workspace?.ai_enabled ?? false,
    )
  }

  // Pre-built computed refs for common checks
  const canCreateTasks = computed(() => can('create_tasks'))
  const canEditTasks = computed(() => can('edit_tasks'))
  const canDeleteTasks = computed(() => can('delete_tasks'))
  const canImportTasks = computed(() => can('import_tasks'))
  const canUploadFiles = computed(() => can('upload_files'))
  const canDeleteFiles = computed(() => can('delete_files'))
  const canUseAI = computed(() => can('use_ai_basic'))
  const canUseDocAgents = computed(() => can('use_ai_doc_agents'))
  const canCreateMeetings = computed(() => can('create_meetings'))
  const canManageLabels = computed(() => can('manage_labels'))
  const canDeleteLabels = computed(() => can('delete_labels'))
  const canManageMembers = computed(() => can('manage_members'))
  const canViewUsageStats = computed(() => can('view_usage_stats'))
  const canManageWorkspace = computed(() => can('manage_workspace'))
  const canManageComments = computed(() => can('manage_comments'))
  const canViewTimesheets = computed(() => can('view_timesheets'))
  const canManageTimesheets = computed(() => can('manage_timesheets'))
  const canViewReports = computed(() => can('view_reports'))
  const canManageSprints = computed(() => can('manage_sprints'))
  const canViewGoals = computed(() => can('view_goals'))
  const canManageGoals = computed(() => can('manage_goals'))
  const canViewRoadmap = computed(() => can('view_roadmap'))

  return {
    can,
    canCreateTasks,
    canEditTasks,
    canDeleteTasks,
    canImportTasks,
    canUploadFiles,
    canDeleteFiles,
    canUseAI,
    canUseDocAgents,
    canCreateMeetings,
    canManageLabels,
    canDeleteLabels,
    canManageMembers,
    canViewUsageStats,
    canManageWorkspace,
    canManageComments,
    canViewTimesheets,
    canManageTimesheets,
    canViewReports,
    canManageSprints,
    canViewGoals,
    canManageGoals,
    canViewRoadmap,
  }
}
