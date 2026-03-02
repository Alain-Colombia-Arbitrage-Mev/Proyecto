import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'admin')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  if (!body.email || typeof body.email !== 'string') throw createError({ statusCode: 400, message: 'Email is required' })

  const normalizedEmail = body.email.trim().toLowerCase()

  // Find user by email — paginate to handle large user bases
  let targetUser: any = null
  let page = 1
  const perPage = 500
  while (!targetUser) {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })
    if (authErr) throw createError({ statusCode: 500, message: 'Error searching users' })

    const users = authData?.users || []
    targetUser = users.find((u: any) => u.email?.toLowerCase() === normalizedEmail)

    if (targetUser || users.length < perPage) break
    page++
    if (page > 20) break // Safety limit
  }
  if (!targetUser) {
    throw createError({ statusCode: 404, message: 'No se encontró un usuario con ese email. Debe registrarse primero.' })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUser.id)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Este usuario ya es miembro del workspace' })
  }

  const { data: member, error } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: targetUser.id,
      role: body.role || 'member',
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error adding member' })
  return { ...member, email: targetUser.email }
})
