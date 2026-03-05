import { serverSupabaseServiceRole } from '#supabase/server'
import { getWorkspaceSubscription } from '~~/server/utils/subscription'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  let subscription = null
  try {
    subscription = await getWorkspaceSubscription(supabase, workspaceId)
  } catch { /* table may not exist yet */ }

  // Get current usage counts
  const [{ count: projectCount }, { count: memberCount }] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('workspace_members').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
  ])

  return {
    subscription,
    usage: {
      projects: projectCount || 0,
      members: memberCount || 0,
    },
  }
})
