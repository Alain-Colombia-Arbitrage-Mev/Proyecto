import { serverSupabaseServiceRole } from '#supabase/server'
import { ALL_PERMISSIONS, ALL_ROLES, getRolePermissions, PERMISSION_LABELS } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const supabase = serverSupabaseServiceRole(event)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('ai_config')
    .eq('id', workspaceId)
    .single()

  const overrides = (workspace?.ai_config as any)?.role_permissions || {}

  // Build permission matrix for all editable roles (not superadmin)
  const editableRoles = ALL_ROLES.filter(r => r !== 'superadmin')
  const matrix: Record<string, Record<string, boolean>> = {}
  for (const role of editableRoles) {
    matrix[role] = getRolePermissions(role, overrides)
  }

  return {
    roles: editableRoles,
    permissions: ALL_PERMISSIONS,
    labels: PERMISSION_LABELS,
    matrix,
    overrides,
  }
})
