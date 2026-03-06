import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'manage_workflows')

  const workflowId = getRouterParam(event, 'workflowId')!
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description
  if (body.type !== undefined) updateData.type = body.type
  if (body.status !== undefined) updateData.status = body.status
  if (body.nodes !== undefined) updateData.nodes = body.nodes

  const { data, error } = await supabase
    .from('workflows')
    .update(updateData)
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
