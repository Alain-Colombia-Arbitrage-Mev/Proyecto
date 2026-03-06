import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'use_workflows')

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data || []
})
