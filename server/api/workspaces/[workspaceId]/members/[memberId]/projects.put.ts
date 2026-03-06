import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const memberId = getRouterParam(event, 'memberId')!
  const { user } = await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  if (!Array.isArray(body.project_ids)) {
    throw createError({ statusCode: 400, message: 'project_ids[] is required' })
  }

  // Get the target member to find their user_id and role
  const { data: target } = await supabase
    .from('workspace_members')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!target) throw createError({ statusCode: 404, message: 'Member not found' })

  // admin+ don't need project_members (they see everything)
  if (['admin', 'owner', 'superadmin'].includes(target.role)) {
    throw createError({ statusCode: 400, message: 'admin/owner/superadmin tienen acceso a todos los proyectos' })
  }

  // Replace: delete all current entries, then insert new ones
  const { error: delErr } = await supabase
    .from('project_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', target.user_id)

  if (delErr) {
    console.error(`[projects.put] Error deleting project_members for user ${target.user_id}:`, delErr.message)
    throw createError({ statusCode: 500, message: 'Error clearing project access' })
  }

  console.log(`[projects.put] Cleared project_members for user ${target.user_id}, inserting ${body.project_ids.length} projects`)

  if (body.project_ids.length > 0) {
    const rows = body.project_ids.map((pid: string) => ({
      project_id: pid,
      user_id: target.user_id,
      workspace_id: workspaceId,
      granted_by: user.id,
    }))

    const { error } = await supabase.from('project_members').insert(rows)
    if (error) {
      console.error(`[projects.put] Error inserting project_members:`, error.message)
      throw createError({ statusCode: 500, message: 'Error updating project access' })
    }
  }

  return { success: true, project_ids: body.project_ids }
})
