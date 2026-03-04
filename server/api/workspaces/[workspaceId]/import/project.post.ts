import { serverSupabaseServiceRole } from '#supabase/server'
import { parseImportCsv } from '~~/server/utils/csvImporter'

const MAX_IMPORT_TASKS = 500

const TEMPLATES: Record<string, { title: string; color: string; wip_limit?: number }[]> = {
  simple: [
    { title: 'Pendiente', color: '#3B82F6' },
    { title: 'En Progreso', color: '#F59E0B', wip_limit: 5 },
    { title: 'Hecho', color: '#10B981' },
  ],
  kanban: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'To Do', color: '#3B82F6' },
    { title: 'En Progreso', color: '#F59E0B', wip_limit: 5 },
    { title: 'Revisión', color: '#8B5CF6', wip_limit: 3 },
    { title: 'Hecho', color: '#10B981' },
  ],
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user, membership } = await requirePermission(event, workspaceId, 'create_tasks')

  const body = await readBody(event)
  if (!body.csv) throw createError({ statusCode: 400, message: 'csv field is required' })
  if (!body.name) throw createError({ statusCode: 400, message: 'Project name is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Parse CSV first to validate before creating project
  const { platform, tasks: importedTasks } = parseImportCsv(body.csv as string)
  if (importedTasks.length === 0) {
    const headers = body.csv.split(/[\r\n]/)[0]?.substring(0, 200) || ''
    throw createError({ statusCode: 400, message: `No valid tasks found in CSV. Detected platform: ${platform}. Headers: ${headers}` })
  }
  if (importedTasks.length > MAX_IMPORT_TASKS) {
    throw createError({ statusCode: 400, message: `Maximum ${MAX_IMPORT_TASKS} tasks per import` })
  }

  const rawTemplate = body.kanban_template || 'simple'
  const template = typeof rawTemplate === 'object' ? rawTemplate.value || 'simple' : rawTemplate
  const rawPriority = body.priority || 'medium'
  const priority = typeof rawPriority === 'object' ? rawPriority.value || 'medium' : rawPriority

  // 1. Create the project
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspaceId,
      name: body.name,
      description: body.description || null,
      status: 'active',
      priority,
      category: body.category || null,
      owner_id: user.id,
      kanban_template: template,
      color: body.color || '#0ea5e9',
    })
    .select()
    .single()
  if (projErr) throw createError({ statusCode: 500, message: 'Error creating project' })

  // 2. Create kanban columns
  const cols = (TEMPLATES[template] || TEMPLATES.simple!).map((col, i) => ({
    project_id: project.id,
    title: col.title,
    color: col.color,
    position: i,
    wip_limit: col.wip_limit || null,
  }))

  const { data: createdCols, error: colErr } = await supabase
    .from('kanban_columns')
    .insert(cols)
    .select('id, title, position')
  if (colErr) throw createError({ statusCode: 500, message: 'Error creating kanban columns' })

  // 3. Auto-assign creator if member/viewer
  const roleLevel: Record<string, number> = { viewer: 0, member: 1, admin: 2, owner: 3, superadmin: 4 }
  if ((roleLevel[membership.role] ?? 0) < 2) {
    try {
      await supabase.from('project_members').upsert({
        project_id: project.id,
        user_id: user.id,
        workspace_id: workspaceId,
        granted_by: user.id,
      }, { onConflict: 'project_id,user_id' })
    } catch { /* table may not exist yet */ }
  }

  // 4. Build column mapping and import tasks
  const columnMap: Record<string, string> = {}
  const sortedCols = (createdCols || []).sort((a, b) => a.position - b.position)
  for (const col of sortedCols) {
    columnMap[col.title.toLowerCase()] = col.id
  }
  const defaultColumnId = sortedCols[0]?.id || null

  // Resolve assignee names → user IDs (best-effort)
  const allAssigneeNames = new Set<string>()
  for (const t of importedTasks) {
    for (const a of t.assignees) allAssigneeNames.add(a.toLowerCase())
  }
  const assigneeNameToId: Record<string, string> = {}
  if (allAssigneeNames.size > 0) {
    try {
      const { data: members } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      if (members?.users) {
        for (const u of members.users) {
          const name = (u.user_metadata?.full_name || u.email || '').toLowerCase()
          const email = (u.email || '').toLowerCase()
          if (allAssigneeNames.has(name)) assigneeNameToId[name] = u.id
          if (allAssigneeNames.has(email)) assigneeNameToId[email] = u.id
        }
      }
    } catch { /* can't resolve — skip assignees */ }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const taskRecords = importedTasks.map((t, i) => {
    let columnId = defaultColumnId
    if (t.status) {
      const mapped = columnMap[t.status.toLowerCase()]
      if (mapped) columnId = mapped
    }

    // Resolve assignees: keep valid UUIDs, map names to IDs, drop unresolvable
    const resolvedAssignees = (t.assignees || [])
      .map(a => uuidRegex.test(a) ? a : assigneeNameToId[a.toLowerCase()])
      .filter((a): a is string => !!a)

    return {
      project_id: project.id,
      column_id: columnId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      reporter_id: user.id,
      due_date: t.due_date,
      estimated_hours: t.estimated_hours,
      position: i,
      tags: t.tags,
      assignees: resolvedAssignees,
    }
  })

  const { data: createdTasks, error: taskErr } = await supabase
    .from('tasks')
    .insert(taskRecords)
    .select()

  if (taskErr) {
    console.error('[import/project] Error importing tasks:', taskErr.message, taskErr.details, taskErr.hint)
    // Project is already created — return it with 0 tasks
    return {
      project,
      columns: cols.map(c => c.title),
      platform,
      imported: 0,
    }
  }

  return {
    project,
    columns: cols.map(c => c.title),
    platform,
    imported: createdTasks?.length || 0,
  }
})
