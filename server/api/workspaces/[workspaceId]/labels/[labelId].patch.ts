import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const labelId = getRouterParam(event, 'labelId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.slice(0, 50)
  if (body.color !== undefined) updates.color = body.color

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update' })
  }

  const { data, error } = await supabase
    .from('labels')
    .update(updates)
    .eq('id', labelId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error updating label' })
  return data
})
