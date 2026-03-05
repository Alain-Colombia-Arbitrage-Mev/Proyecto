import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'owner')

  const body = await readBody(event)
  const { overrides } = body

  if (!overrides || typeof overrides !== 'object') {
    throw createError({ statusCode: 400, message: 'overrides object is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Load current ai_config and merge role_permissions
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('ai_config')
    .eq('id', workspaceId)
    .single()

  const currentConfig = (workspace?.ai_config as any) || {}
  const newConfig = { ...currentConfig, role_permissions: overrides }

  const { error } = await supabase
    .from('workspaces')
    .update({ ai_config: newConfig, updated_at: new Date().toISOString() })
    .eq('id', workspaceId)

  if (error) throw createError({ statusCode: 500, message: 'Error saving role permissions' })

  return { success: true }
})
