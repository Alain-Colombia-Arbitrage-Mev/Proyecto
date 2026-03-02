import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const { query, agentType, limit, threshold } = body

  if (!query || typeof query !== 'string') {
    throw createError({ statusCode: 400, message: 'query is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const results = await searchMemories({
    supabase,
    workspaceId,
    query,
    agentType: agentType || null,
    limit: typeof limit === 'number' ? Math.min(limit, 20) : 5,
    threshold: typeof threshold === 'number' ? threshold : 0.65,
  })

  return { results }
})
