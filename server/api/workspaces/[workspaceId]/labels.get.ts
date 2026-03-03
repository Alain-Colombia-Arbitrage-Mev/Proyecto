import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: 'Error fetching labels' })
  return data || []
})
