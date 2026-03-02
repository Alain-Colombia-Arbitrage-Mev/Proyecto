import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  const { contentText, agentType, contentType, projectId, metadata } = body

  if (!contentText || typeof contentText !== 'string') {
    throw createError({ statusCode: 400, message: 'contentText is required' })
  }

  const validAgentTypes = ['memory', 'architecture', 'task']
  const validContentTypes = ['task', 'document', 'chat', 'decision']

  const supabase = serverSupabaseServiceRole(event)

  await storeMemory({
    supabase,
    workspaceId,
    contentText,
    agentType: validAgentTypes.includes(agentType) ? agentType : 'memory',
    contentType: validContentTypes.includes(contentType) ? contentType : 'chat',
    projectId: projectId || null,
    metadata: metadata || {},
    createdBy: user.id,
  })

  return { success: true }
})
