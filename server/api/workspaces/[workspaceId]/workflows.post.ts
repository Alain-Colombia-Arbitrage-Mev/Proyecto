import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'use_workflows')

  const user = await requireUser(event)

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      workspace_id: workspaceId,
      name: body.name || 'Untitled Workflow',
      description: body.description || null,
      type: body.type || 'ai_agent',
      status: 'draft',
      nodes: body.nodes || [],
      created_by: user.id,
      run_count: 0,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
