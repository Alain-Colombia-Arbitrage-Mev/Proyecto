import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  // Fetch current workspace to merge ai_config
  const { data: current } = await supabase
    .from('workspaces')
    .select('ai_config')
    .eq('id', workspaceId)
    .single()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name
  if (body.color !== undefined) updates.color = body.color
  if (body.ai_enabled !== undefined) updates.ai_enabled = body.ai_enabled

  // Deep merge ai_config to preserve existing keys
  if (body.ai_config !== undefined) {
    const existing = (current?.ai_config as Record<string, any>) || {}
    const incoming = body.ai_config as Record<string, any>
    updates.ai_config = {
      ...existing,
      ...incoming,
      // Deep merge modules specifically
      modules: { ...(existing.modules || {}), ...(incoming.modules || {}) },
    }
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error updating workspace' })
  return data
})
