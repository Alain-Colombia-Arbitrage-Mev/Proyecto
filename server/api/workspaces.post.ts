import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  if (!body.name) throw createError({ statusCode: 400, message: 'Name is required' })

  const baseSlug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const supabase = serverSupabaseServiceRole(event)

  // Generate unique slug — check if base exists, append number if needed
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (!existing || existing.length === 0) break

    attempt++
    slug = `${baseSlug}-${attempt}`

    if (attempt > 20) {
      // Fallback: append random suffix
      slug = `${baseSlug}-${Date.now().toString(36)}`
      break
    }
  }

  // Create workspace
  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name: body.name, slug, owner_id: user.id, color: body.color || '#0ea5e9' })
    .select()
    .single()
  if (wsErr) {
    // Handle unique constraint violation gracefully
    if (wsErr.code === '23505') {
      throw createError({ statusCode: 409, message: 'A workspace with this name already exists' })
    }
    throw createError({ statusCode: 500, message: 'Error creating workspace' })
  }

  // Add creator as owner
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })
  if (memErr) throw createError({ statusCode: 500, message: 'Error creating workspace membership' })

  return workspace
})
