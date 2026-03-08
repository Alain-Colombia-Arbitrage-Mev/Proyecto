import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const user = await requireUser(event)
  const supabase = serverSupabaseServiceRole(event)

  // Only owner or superadmin can delete
  const isSuperadmin = isPlatformAdmin(user.email)

  if (!isSuperadmin) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      throw createError({ statusCode: 403, message: 'Only the owner can delete this workspace' })
    }
  }

  // Delete workspace (cascades to members, projects, tasks, etc.)
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
