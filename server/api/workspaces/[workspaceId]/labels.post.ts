import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const body = await readBody(event)
  if (!body.name || !body.color) {
    throw createError({ statusCode: 400, message: 'name and color are required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('labels')
    .insert({
      workspace_id: workspaceId,
      name: body.name.slice(0, 50),
      color: body.color,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error creating label' })
  return data
})
