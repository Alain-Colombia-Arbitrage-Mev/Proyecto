import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'view_usage_stats')

  const supabase = serverSupabaseServiceRole(event)

  try {
    const stats = await getWorkspaceTokenUsage({ supabase, workspaceId })
    return stats
  } catch (err: any) {
    console.error('[usage.get] Error:', err.message || err)
    throw createError({ statusCode: 500, message: 'Error fetching usage stats' })
  }
})
