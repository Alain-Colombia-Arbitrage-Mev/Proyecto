import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const workspaceId = getRouterParam(event, 'workspaceId')!
    const { user } = await requireWorkspaceMember(event, workspaceId)
    const supabase = serverSupabaseServiceRole(event)

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.warn('[notifications] query error:', error.message)
      return []
    }
    return data || []
  } catch (err: any) {
    // Gracefully return empty — avoid 500 spam from polling
    if (err?.statusCode === 401) throw err
    console.warn('[notifications] error:', err?.message || err)
    return []
  }
})
