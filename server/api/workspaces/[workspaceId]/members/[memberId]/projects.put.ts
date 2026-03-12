import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'
import { projectAssignedEmailHtml } from '~~/server/utils/email'

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

  // Get current project_ids before replacing (to detect newly added ones)
  const { data: currentPM } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', target.user_id)
  const oldProjectIds = new Set((currentPM || []).map(pm => pm.project_id))

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

  // Notify user about newly assigned projects (fire-and-forget)
  const newProjectIds = (body.project_ids as string[]).filter(pid => !oldProjectIds.has(pid))
  if (newProjectIds.length > 0 && target.user_id !== user.id) {
    // Fetch project names and workspace name
    const [{ data: projects }, { data: workspace }] = await Promise.all([
      supabase.from('projects').select('id, name').in('id', newProjectIds),
      supabase.from('workspaces').select('name').eq('id', workspaceId).maybeSingle(),
    ])
    const projectNames = (projects || []).map(p => p.name || 'Proyecto')
    const workspaceName = workspace?.name || 'Workspace'

    let assignerName = 'Alguien'
    try {
      const { data: profile } = await supabase.auth.admin.getUserById(user.id)
      assignerName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Alguien'
    } catch {}

    const projectLabel = projectNames.length === 1 ? projectNames[0] : `${projectNames.length} proyectos`

    notifyUser({
      event,
      userId: target.user_id,
      type: 'project_assigned',
      title: `Proyecto asignado: ${projectLabel}`,
      body: `${assignerName} te asignó acceso a ${projectLabel} en ${workspaceName}`,
      entityType: 'project',
      entityId: newProjectIds[0],
      emailSubject: `Proyecto asignado: ${projectLabel}`,
      emailHtml: projectAssignedEmailHtml(projectNames, assignerName, workspaceName),
    }).catch(err => console.error(`[projects.put] notifyUser failed:`, err))
  }

  return { success: true, project_ids: body.project_ids }
})
