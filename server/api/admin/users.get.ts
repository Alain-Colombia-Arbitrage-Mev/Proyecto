import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * GET /api/admin/users
 * Superadmin-only: returns all platform users with their workspace memberships,
 * team sizes, project counts, and task counts.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  if (!isPlatformAdmin(user.email)) {
    throw createError({ statusCode: 403, message: 'Superadmin access required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // 1. Get all auth users
  const allUsers: Array<{ id: string; email: string; created_at: string; last_sign_in_at: string | null }> = []
  let page = 1
  const perPage = 500
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) break
    for (const u of data.users) {
      allUsers.push({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
      })
    }
    if (data.users.length < perPage) break
    page++
  }

  // 2. Get all workspace memberships
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('user_id, role, workspace_id, workspaces(id, name, slug)')

  // 3. Get task counts per user (assignees array)
  let taskCountMap: Record<string, { total: number; completed: number; in_progress: number }> = {}

  // Try RPC first, fallback to manual query
  const { data: taskCounts } = await supabase.rpc('admin_user_task_counts').select('*')

  if (taskCounts && Array.isArray(taskCounts) && taskCounts.length > 0) {
    for (const tc of taskCounts) {
      taskCountMap[tc.user_id] = {
        total: tc.total || 0,
        completed: tc.completed || 0,
        in_progress: tc.in_progress || 0,
      }
    }
  } else {
    // Fallback: query tasks with assignees + column title
    const { data: tasks } = await supabase
      .from('tasks')
      .select('assignees, column_id, kanban_columns(title)')

    if (tasks) {
      for (const task of tasks) {
        const assigneeList = (task as any).assignees
        if (!assigneeList || !Array.isArray(assigneeList)) continue
        for (const uid of assigneeList) {
          if (!taskCountMap[uid]) taskCountMap[uid] = { total: 0, completed: 0, in_progress: 0 }
          taskCountMap[uid].total++
          const colTitle = ((task as any).kanban_columns?.title || '').toLowerCase()
          if (colTitle.includes('done') || colTitle.includes('complet') || colTitle.includes('termin')) {
            taskCountMap[uid].completed++
          } else if (colTitle.includes('progress') || colTitle.includes('doing') || colTitle.includes('curso')) {
            taskCountMap[uid].in_progress++
          }
        }
      }
    }
  }

  // 4. Get workspace member counts
  const workspaceMemberCounts: Record<string, number> = {}
  if (memberships) {
    for (const m of memberships as any[]) {
      const wsId = m.workspace_id
      workspaceMemberCounts[wsId] = (workspaceMemberCounts[wsId] || 0) + 1
    }
  }

  // 5. Get project counts per workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('id, workspace_id')

  const workspaceProjectCounts: Record<string, number> = {}
  if (projects) {
    for (const p of projects) {
      workspaceProjectCounts[p.workspace_id] = (workspaceProjectCounts[p.workspace_id] || 0) + 1
    }
  }

  // 6. Build user rows
  const users = allUsers.map((u) => {
    const userMemberships = (memberships || []).filter((m: any) => m.user_id === u.id)
    const workspaces = userMemberships.map((m: any) => ({
      id: m.workspace_id,
      name: m.workspaces?.name || '—',
      slug: m.workspaces?.slug || '',
      role: m.role,
      memberCount: workspaceMemberCounts[m.workspace_id] || 0,
      projectCount: workspaceProjectCounts[m.workspace_id] || 0,
    }))

    const tasks = taskCountMap[u.id] || { total: 0, completed: 0, in_progress: 0 }

    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      workspaces,
      tasks,
      totalWorkspaces: workspaces.length,
    }
  })

  return {
    total: users.length,
    users,
  }
})
