import { serverSupabaseServiceRole } from '#supabase/server'

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
  dev: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Análisis', color: '#8B5CF6' },
    { title: 'Dev', color: '#3B82F6', wip_limit: 5 },
    { title: 'Code Review', color: '#F59E0B', wip_limit: 3 },
    { title: 'QA', color: '#F97316', wip_limit: 3 },
    { title: 'Producción', color: '#10B981' },
  ],
  devops: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Diseño', color: '#8B5CF6' },
    { title: 'Desarrollo', color: '#3B82F6', wip_limit: 4 },
    { title: 'Code Review', color: '#6366F1', wip_limit: 3 },
    { title: 'CI/CD', color: '#F59E0B', wip_limit: 3 },
    { title: 'Staging', color: '#F97316', wip_limit: 3 },
    { title: 'Producción', color: '#10B981' },
    { title: 'Monitoreo', color: '#14B8A6' },
  ],
  support: [
    { title: 'Nuevo', color: '#3B82F6' },
    { title: 'Triaje', color: '#6366F1' },
    { title: 'Asignado', color: '#8B5CF6' },
    { title: 'En Proceso', color: '#F59E0B', wip_limit: 5 },
    { title: 'Esperando', color: '#F97316' },
    { title: 'Cerrado', color: '#10B981' },
  ],
  scrum: [
    { title: 'Product Backlog', color: '#6B7280' },
    { title: 'Sprint Backlog', color: '#6366F1' },
    { title: 'En Progreso', color: '#3B82F6', wip_limit: 4 },
    { title: 'En Review', color: '#F59E0B', wip_limit: 3 },
    { title: 'QA', color: '#8B5CF6', wip_limit: 3 },
    { title: 'Done', color: '#10B981' },
  ],
  scrumban: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Listo para Pull', color: '#6366F1' },
    { title: 'En Progreso', color: '#3B82F6', wip_limit: 4 },
    { title: 'Review', color: '#F59E0B', wip_limit: 3 },
    { title: 'Testing', color: '#8B5CF6', wip_limit: 3 },
    { title: 'Deploy', color: '#F97316' },
    { title: 'Done', color: '#10B981' },
    { title: 'Archivado', color: '#9CA3AF' },
  ],
  marketing: [
    { title: 'Ideas', color: '#EC4899' },
    { title: 'Planificación', color: '#8B5CF6' },
    { title: 'Creación', color: '#3B82F6', wip_limit: 5 },
    { title: 'Revisión', color: '#F59E0B', wip_limit: 3 },
    { title: 'Aprobado', color: '#10B981' },
    { title: 'Publicado', color: '#06B6D4' },
    { title: 'Análisis', color: '#6366F1' },
  ],
  ai_agents: [
    { title: 'Prompts Pendientes', color: '#6B7280' },
    { title: 'Diseño de Agente', color: '#8B5CF6' },
    { title: 'Entrenamiento', color: '#3B82F6', wip_limit: 3 },
    { title: 'Testing', color: '#F59E0B', wip_limit: 3 },
    { title: 'Evaluación', color: '#F97316' },
    { title: 'Producción', color: '#10B981' },
    { title: 'Monitoreo', color: '#06B6D4' },
  ],
  backend_senior_dev: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Diseño de API', color: '#8B5CF6' },
    { title: 'Desarrollo', color: '#3B82F6', wip_limit: 4 },
    { title: 'Code Review', color: '#6366F1', wip_limit: 3 },
    { title: 'Testing / QA', color: '#F59E0B', wip_limit: 3 },
    { title: 'Seguridad / RLS', color: '#EF4444' },
    { title: 'Deploy / DevOps', color: '#F97316' },
    { title: 'Producción', color: '#10B981' },
    { title: 'Monitoreo', color: '#14B8A6' },
  ],
  frontend_design: [
    { title: 'Inspiración', color: '#EC4899' },
    { title: 'Wireframes', color: '#8B5CF6' },
    { title: 'Diseño UI', color: '#6366F1' },
    { title: 'Prototipo', color: '#3B82F6' },
    { title: 'Desarrollo Frontend', color: '#F59E0B', wip_limit: 4 },
    { title: 'Review / QA Visual', color: '#F97316', wip_limit: 3 },
    { title: 'Integración', color: '#14B8A6' },
    { title: 'Publicado', color: '#10B981' },
  ],
  app_development: [
    { title: 'Backlog', color: '#6B7280' },
    { title: 'Diseño UX/UI', color: '#EC4899' },
    { title: 'Desarrollo', color: '#3B82F6', wip_limit: 4 },
    { title: 'Code Review', color: '#6366F1', wip_limit: 3 },
    { title: 'QA / Testing', color: '#F59E0B', wip_limit: 3 },
    { title: 'Beta', color: '#F97316' },
    { title: 'Release', color: '#10B981' },
    { title: 'Post-Launch', color: '#14B8A6' },
  ],
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

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
    wip_limit: col.wip_limit || null,
  }))

  const { error: colErr } = await supabase.from('kanban_columns').insert(cols)
  if (colErr) throw createError({ statusCode: 500, message: 'Error creating kanban columns' })

  // Auto-assign creator to project if they are member/viewer
  const roleLevel = { viewer: 0, member: 1, admin: 2, owner: 3, superadmin: 4 }
  if ((roleLevel[membership.role as keyof typeof roleLevel] ?? 0) < 2) {
    try {
      await supabase.from('project_members').upsert({
        project_id: project.id,
        user_id: user.id,
        workspace_id: workspaceId,
        granted_by: user.id,
      }, { onConflict: 'project_id,user_id' })
    } catch { /* table may not exist yet */ }
  }

  // Auto-create project-specific folders based on template
  const TEMPLATE_FOLDERS: Record<string, string[]> = {
    backend_senior_dev: ['/backend', '/backend/api-docs', '/backend/migrations', '/backend/tests'],
    frontend_design: ['/frontend', '/frontend/wireframes', '/frontend/ui-assets', '/frontend/prototipos'],
    dev: ['/dev', '/dev/docs', '/dev/tests'],
    devops: ['/devops', '/devops/infra', '/devops/ci-cd', '/devops/monitoring'],
    scrum: ['/sprints', '/sprints/retrospectivas'],
    marketing: ['/marketing', '/marketing/assets', '/marketing/campañas'],
    ai_agents: ['/agents', '/agents/prompts', '/agents/evaluaciones'],
    app_development: ['/app', '/app/design', '/app/releases', '/app/tests'],
  }

  const projectSlug = body.name.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 50).toLowerCase()
  const folders = TEMPLATE_FOLDERS[template] || []

  // Create placeholder files to establish folder structure
  if (folders.length > 0) {
    const placeholderContent = new TextEncoder().encode('# Carpeta del proyecto\n')
    for (const folder of folders) {
      const projectFolder = `/proyectos/${projectSlug}${folder}`
      const storagePath = `${workspaceId}/proyectos/${projectSlug}${folder}/.gitkeep`
      try {
        await supabase.storage
          .from('workspace-files')
          .upload(storagePath, placeholderContent, { contentType: 'text/plain', upsert: true })

        await supabase.from('workspace_files').insert({
          workspace_id: workspaceId,
          project_id: project.id,
          uploaded_by: user.id,
          file_name: '.gitkeep',
          file_path: storagePath,
          file_size: placeholderContent.length,
          mime_type: 'text/plain',
          folder: projectFolder,
          source: 'ai_generated',
        })
      } catch { /* silent — folder creation is best-effort */ }
    }
  }

  return { ...project, columns: cols.map(c => c.title) }
})
