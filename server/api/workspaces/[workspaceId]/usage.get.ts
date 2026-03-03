import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'view_usage_stats')

  const supabase = serverSupabaseServiceRole(event)
  const stats = await getWorkspaceTokenUsage({ supabase, workspaceId })

  return stats
})
