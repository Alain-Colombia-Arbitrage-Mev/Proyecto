import { serverSupabaseServiceRole } from '#supabase/server'
import { parseImportCsv } from '~~/server/utils/csvImporter'

const MAX_IMPORT_TASKS = 500

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requirePermission(event, workspaceId, 'import_tasks')

  const body = await readBody(event)
  if (!body.csv) throw createError({ statusCode: 400, message: 'csv field is required' })
  if (!body.project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Verify project belongs to this workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', body.project_id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found in this workspace' })

  // Parse CSV
  const { platform, tasks: importedTasks } = parseImportCsv(body.csv as string)

  if (importedTasks.length === 0) {
    throw createError({ statusCode: 400, message: 'No valid tasks found in CSV' })
  }
  if (importedTasks.length > MAX_IMPORT_TASKS) {
    throw createError({ statusCode: 400, message: `Maximum ${MAX_IMPORT_TASKS} tasks per import` })
  }

  // Build column mapping if requested
  let columnMap: Record<string, string> = {}
  let defaultColumnId: string | null = body.column_id || null

  if (body.map_columns) {
    // Fetch existing columns for this project
    const { data: columns } = await supabase
      .from('kanban_columns')
      .select('id, title')
      .eq('project_id', body.project_id)
      .order('position', { ascending: true })

    if (columns && columns.length > 0) {
      // Map status values to column IDs (case-insensitive)
      for (const col of columns) {
        columnMap[col.title.toLowerCase()] = col.id
      }
      // Default to first column if no specific column_id provided
      if (!defaultColumnId) {
        defaultColumnId = columns[0]!.id
      }
    }
  }

  // Get max position in target column(s)
  const { data: maxPosData } = await supabase
    .from('tasks')
    .select('position')
    .eq('project_id', body.project_id)
    .order('position', { ascending: false })
    .limit(1)

  let nextPosition = (maxPosData && maxPosData.length > 0) ? maxPosData[0]!.position + 1 : 0

  // Build task records for batch insert
  const taskRecords = importedTasks.map((t) => {
    let columnId = defaultColumnId
    if (body.map_columns && t.status) {
      const mapped = columnMap[t.status.toLowerCase()]
      if (mapped) columnId = mapped
    }

    const record = {
      project_id: body.project_id as string,
      column_id: columnId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      reporter_id: user.id,
      due_date: t.due_date,
      estimated_hours: t.estimated_hours,
      position: nextPosition++,
      tags: t.tags,
      assignees: [] as string[],
    }
    return record
  })

  // Batch insert tasks
  const { data: createdTasks, error } = await supabase
    .from('tasks')
    .insert(taskRecords)
    .select()

  if (error) throw createError({ statusCode: 500, message: 'Error importing tasks' })

  return {
    platform,
    imported: createdTasks?.length || 0,
    tasks: createdTasks || [],
  }
})
