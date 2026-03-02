import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * Platform superadmins — these emails have full access to ALL workspaces.
 * In production, move this to an env var or DB table.
 */
const PLATFORM_ADMINS = ['guardcolombia@gmail.com'].map(e => e.toLowerCase())

/**
 * Role hierarchy levels
 */
const ROLE_LEVELS: Record<string, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
  superadmin: 4,
}

/**
 * Check if an email is a platform superadmin
 */
export function isPlatformAdmin(email: string | undefined): boolean {
  if (!email) return false
  return PLATFORM_ADMINS.includes(email.toLowerCase())
}

/**
 * Get authenticated user or throw 401
 */
export async function requireUser(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Not authenticated' })
  return user
}

/**
 * Verify the authenticated user is a member of the given workspace.
 * Platform admins (superadmins) bypass membership checks.
 * Auto-fixes missing membership for workspace owners.
 */
export async function requireWorkspaceMember(event: H3Event, workspaceId: string) {
  const user = await requireUser(event)
  const supabase = serverSupabaseServiceRole(event)

  // Platform superadmin — full access to everything
  if (isPlatformAdmin(user.email)) {
    return { user, membership: { id: 'superadmin', role: 'superadmin' } }
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) {
    return { user, membership }
  }

  // No membership found — check if user is the workspace owner (auto-fix)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (workspace && workspace.owner_id === user.id) {
    const { data: newMembership, error: upsertErr } = await supabase
      .from('workspace_members')
      .upsert({ workspace_id: workspaceId, user_id: user.id, role: 'owner' }, { onConflict: 'workspace_id,user_id' })
      .select('id, role')
      .single()

    if (upsertErr) {
      console.error('[auth] Auto-fix upsert failed:', upsertErr.message)
    }
    if (newMembership) {
      return { user, membership: newMembership }
    }
  }

  throw createError({ statusCode: 403, message: 'No tienes acceso a este workspace' })
}

/**
 * Verify the user has a specific role (or higher) in the workspace.
 * Platform admins always pass.
 */
export async function requireWorkspaceRole(event: H3Event, workspaceId: string, minRole: string) {
  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  // superadmin passes everything
  if (membership.role === 'superadmin') {
    return { user, membership }
  }

  const userLevel = ROLE_LEVELS[membership.role] ?? 0
  const requiredLevel = ROLE_LEVELS[minRole] ?? 0

  if (userLevel < requiredLevel) {
    throw createError({ statusCode: 403, message: `Necesitas rol '${minRole}' o superior` })
  }

  return { user, membership }
}
