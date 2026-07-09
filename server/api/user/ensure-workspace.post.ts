import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Idempotent: guarantees the user has at least one workspace.
 * If none exists, creates a personal workspace (user as owner) with a
 * starter project using the kanban template, then returns it.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const supabase = serverSupabaseServiceRole(event)

  // Already has a workspace? Return the first one.
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id, slug)')
    .eq('user_id', user.id)
    .limit(1)

  const existing = memberships?.[0]?.workspaces as { id: string; slug: string } | undefined
  if (existing?.slug) {
    return { id: existing.id, slug: existing.slug, created: false }
  }

  // Derive a friendly name: "Workspace de {name}"
  const fullName = (user.user_metadata?.full_name as string | undefined)
    || (user.user_metadata?.name as string | undefined)
    || user.email?.split('@')[0]
    || 'Personal'
  const firstName = fullName.trim().split(/\s+/)[0]
  const wsName = `Workspace de ${firstName}`

  // Unique slug
  const baseSlug = wsName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: taken } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .limit(1)
    if (!taken || taken.length === 0) break
    attempt++
    slug = `${baseSlug}-${attempt}`
    if (attempt > 20) {
      slug = `${baseSlug}-${Date.now().toString(36)}`
      break
    }
  }

  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name: wsName, slug, owner_id: user.id, color: '#0ea5e9' })
    .select()
    .single()
  if (wsErr) throw createError({ statusCode: 500, message: 'Error creating default workspace' })

  // It's their personal workspace — they own it.
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })
  if (memErr) throw createError({ statusCode: 500, message: 'Error creating workspace membership' })

  // Starter project with kanban columns
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspace.id,
      name: 'Mi Primer Proyecto',
      status: 'active',
      priority: 'medium',
      owner_id: user.id,
      kanban_template: 'kanban',
      color: '#0ea5e9',
    })
    .select()
    .single()

  if (!projErr && project) {
    const cols = KANBAN_TEMPLATES.kanban!.map((col, i) => ({
      project_id: project.id,
      title: col.title,
      color: col.color,
      position: i,
      wip_limit: col.wip_limit || null,
    }))
    await supabase.from('kanban_columns').insert(cols)
  }

  return { id: workspace.id, slug: workspace.slug, created: true }
})
