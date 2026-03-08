import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const user = await requireUser(event)
  const supabase = serverSupabaseServiceRole(event)

  // Check membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    throw createError({ statusCode: 404, message: 'You are not a member of this workspace' })
  }

  // Owner cannot leave — must transfer ownership or delete
  if (membership.role === 'owner') {
    throw createError({ statusCode: 400, message: 'Owner cannot leave. Transfer ownership or delete the workspace.' })
  }

  // Remove from workspace_members
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Also remove from project_members
  await supabase
    .from('project_members')
    .delete()
    .eq('user_id', user.id)
    .in('project_id',
      supabase.from('projects').select('id').eq('workspace_id', workspaceId)
    )

  return { success: true }
})
