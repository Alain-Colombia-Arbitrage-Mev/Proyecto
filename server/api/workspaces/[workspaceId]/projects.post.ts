import { serverSupabaseServiceRole } from '#supabase/server'

const TEMPLATES: Record<string, { title: string; color: string }[]> = {
  simple: [
    { title: 'Pendiente', color: '#3B82F6' },
    { title: 'En Progreso', color: '#F59E0B' },
    { title: 'Hecho', color: '#10B981' },
  ],
  kanban: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'To Do', color: '#3B82F6' },
    { title: 'En Progreso', color: '#F59E0B' },
    { title: 'Revisión', color: '#8B5CF6' },
    { title: 'Hecho', color: '#10B981' },
  ],
  dev: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Análisis', color: '#8B5CF6' },
    { title: 'Dev', color: '#3B82F6' },
    { title: 'Code Review', color: '#F59E0B' },
    { title: 'QA', color: '#F97316' },
    { title: 'Producción', color: '#10B981' },
  ],
  devops: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Diseño', color: '#8B5CF6' },
    { title: 'Desarrollo', color: '#3B82F6' },
    { title: 'Code Review', color: '#6366F1' },
    { title: 'CI/CD', color: '#F59E0B' },
    { title: 'Staging', color: '#F97316' },
    { title: 'Producción', color: '#10B981' },
    { title: 'Monitoreo', color: '#14B8A6' },
  ],
  support: [
    { title: 'Nuevo', color: '#3B82F6' },
    { title: 'Triaje', color: '#6366F1' },
    { title: 'Asignado', color: '#8B5CF6' },
    { title: 'En Proceso', color: '#F59E0B' },
    { title: 'Esperando', color: '#F97316' },
    { title: 'Cerrado', color: '#10B981' },
  ],
  scrum: [
    { title: 'Product Backlog', color: '#6B7280' },
    { title: 'Sprint Backlog', color: '#6366F1' },
    { title: 'En Progreso', color: '#3B82F6' },
    { title: 'En Review', color: '#F59E0B' },
    { title: 'QA', color: '#8B5CF6' },
    { title: 'Done', color: '#10B981' },
  ],
  scrumban: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Listo para Pull', color: '#6366F1' },
    { title: 'En Progreso', color: '#3B82F6' },
    { title: 'Review', color: '#F59E0B' },
    { title: 'Testing', color: '#8B5CF6' },
    { title: 'Deploy', color: '#F97316' },
    { title: 'Done', color: '#10B981' },
    { title: 'Archivado', color: '#9CA3AF' },
  ],
  marketing: [
    { title: 'Ideas', color: '#EC4899' },
    { title: 'Planificación', color: '#8B5CF6' },
    { title: 'Creación', color: '#3B82F6' },
    { title: 'Revisión', color: '#F59E0B' },
    { title: 'Aprobado', color: '#10B981' },
    { title: 'Publicado', color: '#06B6D4' },
    { title: 'Análisis', color: '#6366F1' },
  ],
  ai_agents: [
    { title: 'Prompts Pendientes', color: '#6B7280' },
    { title: 'Diseño de Agente', color: '#8B5CF6' },
    { title: 'Entrenamiento', color: '#3B82F6' },
    { title: 'Testing', color: '#F59E0B' },
    { title: 'Evaluación', color: '#F97316' },
    { title: 'Producción', color: '#10B981' },
    { title: 'Monitoreo', color: '#06B6D4' },
  ],
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  if (!body.name) throw createError({ statusCode: 400, message: 'Project name is required' })

  const rawTemplate = body.kanban_template || 'simple'
  const template = typeof rawTemplate === 'object' ? rawTemplate.value || 'simple' : rawTemplate

  const rawPriority = body.priority || 'medium'
  const priority = typeof rawPriority === 'object' ? rawPriority.value || 'medium' : rawPriority
  const supabase = serverSupabaseServiceRole(event)

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

  const cols = (TEMPLATES[template] || TEMPLATES.simple!).map((col, i) => ({
    project_id: project.id,
    title: col.title,
    color: col.color,
    position: i,
  }))

  const { error: colErr } = await supabase.from('kanban_columns').insert(cols)
  if (colErr) throw createError({ statusCode: 500, message: 'Error creating kanban columns' })

  return { ...project, columns: cols.map(c => c.title) }
})
