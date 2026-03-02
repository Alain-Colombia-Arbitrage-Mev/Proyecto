import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, message: 'Seed not available in production' })
  }

  const user = await requireUser(event)

  const supabase = serverSupabaseServiceRole(event)

  // 1. Create workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .upsert({
      name: 'FocusFlow Dev',
      slug: 'focusflow-dev',
      owner_id: user.id,
      color: '#6366F1',
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (wsError) throw createError({ statusCode: 500, message: wsError.message })

  // 2. Add current user as owner
  const { error: memberError } = await supabase
    .from('workspace_members')
    .upsert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    }, { onConflict: 'workspace_id,user_id' })

  if (memberError) throw createError({ statusCode: 500, message: memberError.message })

  // 3. Create project
  const { data: project, error: projError } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspace.id,
      name: 'Mi Primer Proyecto',
      description: 'Proyecto de prueba creado por el seed de FocusFlow',
      status: 'active',
      priority: 'medium',
      owner_id: user.id,
      kanban_template: 'simple',
      color: '#6366F1',
    })
    .select()
    .single()

  if (projError) throw createError({ statusCode: 500, message: projError.message })

  // 4. Create kanban columns (simple template)
  const columns = [
    { project_id: project.id, title: 'Pendiente', color: '#3B82F6', position: 0 },
    { project_id: project.id, title: 'En Progreso', color: '#F59E0B', position: 1 },
    { project_id: project.id, title: 'Hecho', color: '#10B981', position: 2 },
  ]

  const { error: colError } = await supabase
    .from('kanban_columns')
    .insert(columns)

  if (colError) throw createError({ statusCode: 500, message: colError.message })

  return {
    success: true,
    workspace: { id: workspace.id, slug: workspace.slug },
    project: { id: project.id, name: project.name },
    columns: columns.map(c => c.title),
  }
})
