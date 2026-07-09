import { serverSupabaseServiceRole } from '#supabase/server'


export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user, membership } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  if (!body.name) throw createError({ statusCode: 400, message: 'Project name is required' })

  const rawTemplate = body.kanban_template || 'kanban'
  const template = typeof rawTemplate === 'object' ? rawTemplate.value || 'kanban' : rawTemplate

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

  const cols = (KANBAN_TEMPLATES[template] || KANBAN_TEMPLATES.kanban!).map((col, i) => ({
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
    frontend_dev: ['/frontend', '/frontend/components', '/frontend/pages', '/frontend/stores', '/frontend/assets'],
    backend_dev: ['/backend', '/backend/api', '/backend/migrations', '/backend/tests', '/backend/utils'],
    audio: ['/audio', '/audio/grabaciones', '/audio/mezclas', '/audio/masters'],
    creative: ['/creativo', '/creativo/briefs', '/creativo/conceptos', '/creativo/entregables'],
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
