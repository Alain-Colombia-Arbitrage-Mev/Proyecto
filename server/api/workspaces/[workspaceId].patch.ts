import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name
  if (body.color !== undefined) updates.color = body.color
  if (body.ai_config !== undefined) updates.ai_config = body.ai_config
  if (body.ai_enabled !== undefined) updates.ai_enabled = body.ai_enabled

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error updating workspace' })
  return data
})
