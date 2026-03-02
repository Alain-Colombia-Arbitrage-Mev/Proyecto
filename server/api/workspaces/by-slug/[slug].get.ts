import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const slug = getRouterParam(event, 'slug')
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) throw createError({ statusCode: 404, message: 'Workspace not found' })

  // Platform superadmin — always allowed (no DB writes needed)
  if (isPlatformAdmin(user.email)) {
    return data
  }

  // Regular user — verify membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', data.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    // Auto-fix for workspace owner
    if (data.owner_id === user.id) {
      // Auto-fix: owner without membership row
      await supabase
        .from('workspace_members')
        .upsert({ workspace_id: data.id, user_id: user.id, role: 'owner' }, { onConflict: 'workspace_id,user_id' })
    } else {
      throw createError({ statusCode: 403, message: 'No tienes acceso a este workspace' })
    }
  }

  return data
})
