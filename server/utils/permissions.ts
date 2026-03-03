import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Centralized RBAC permission system for FocusFlow.
 *
 * Each permission maps to the minimum role level required.
 * AI permissions additionally require workspace.ai_enabled = true.
 * Workspaces can override defaults via ai_config.role_permissions.
 */

export type Permission =
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

export const ALL_PERMISSIONS: Permission[] = [
  'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'import_tasks',
  'view_files', 'upload_files', 'delete_files',
  'use_ai_basic', 'use_ai_doc_agents',
  'view_meetings', 'create_meetings',
  'manage_labels', 'delete_labels',
  'manage_members', 'view_usage_stats', 'manage_workspace',
]

export const ALL_ROLES = ['viewer', 'marketing', 'member', 'admin', 'owner', 'superadmin'] as const
export type Role = typeof ALL_ROLES[number]

export const ROLE_LEVELS: Record<string, number> = {
  viewer: 0,
  marketing: 1,   // Same level as member but with restricted default permissions
  member: 1,
  admin: 2,
  owner: 3,
  superadmin: 4,
}

/**
 * Default minimum role level required for each permission.
 *   0 = viewer, 1 = member/marketing, 2 = admin, 3 = owner, 4 = superadmin
 */
export const DEFAULT_PERMISSION_MIN_ROLE: Record<Permission, number> = {
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
}

/**
 * Marketing role has restricted defaults — only these permissions are enabled.
 * Superadmins can customize this via the role permission editor.
 */
export const MARKETING_DEFAULT_PERMISSIONS: Permission[] = [
  'view_tasks',
  'create_tasks',
  'edit_tasks',
  'view_files',
  'upload_files',
  'view_meetings',
  'create_meetings',
  'manage_labels',
]

/** Permissions that additionally require workspace.ai_enabled */
const AI_PERMISSIONS = new Set<Permission>([
  'use_ai_basic',
  'use_ai_doc_agents',
])

/** Human-readable permission labels */
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
}

/**
 * Workspace role_permissions override format:
 * { [role]: { [permission]: boolean } }
 * Only stores explicit overrides. Missing = use default.
 */
export type RolePermissionOverrides = Record<string, Record<string, boolean>>

/**
 * Pure check: does a role have a given permission?
 * Optionally accepts workspace-level overrides.
 */
export function hasPermission(
  role: string,
  permission: Permission,
  overrides?: RolePermissionOverrides,
): boolean {
  if (role === 'superadmin') return true

  // Check workspace-level override first
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

/**
 * Get the full permission set for a role, considering overrides.
 */
export function getRolePermissions(
  role: string,
  overrides?: RolePermissionOverrides,
): Record<Permission, boolean> {
  const result = {} as Record<Permission, boolean>
  for (const perm of ALL_PERMISSIONS) {
    result[perm] = hasPermission(role, perm, overrides)
  }
  return result
}

/**
 * Server-side guard: verifies the user is a workspace member AND has the
 * required permission. For AI permissions, also checks workspace.ai_enabled.
 *
 * Throws 403 if the check fails.
 */
export async function requirePermission(
  event: H3Event,
  workspaceId: string,
  permission: Permission,
) {
  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  // superadmin bypasses everything
  if (membership.role === 'superadmin') {
    return { user, membership }
  }

  // Load workspace for overrides + ai_enabled
  const supabase = serverSupabaseServiceRole(event)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('ai_enabled, ai_config')
    .eq('id', workspaceId)
    .maybeSingle()

  const overrides = (workspace?.ai_config as any)?.role_permissions as RolePermissionOverrides | undefined

  // Role-level check with overrides
  if (!hasPermission(membership.role, permission, overrides)) {
    throw createError({
      statusCode: 403,
      message: `Permiso insuficiente: se requiere '${permission}'`,
    })
  }

  // AI-gated permissions — check workspace.ai_enabled
  if (AI_PERMISSIONS.has(permission)) {
    if (!workspace?.ai_enabled) {
      throw createError({
        statusCode: 403,
        message: 'AI está deshabilitado en este workspace',
      })
    }
  }

  return { user, membership }
}
