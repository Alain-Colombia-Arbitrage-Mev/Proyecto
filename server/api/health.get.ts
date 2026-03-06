import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const publicConfig = config.public as any

  const diagnostics: Record<string, unknown> = {
    ok: true,
    env: {
      hasSupabaseUrl: !!publicConfig?.supabase?.url,
      supabaseUrl: publicConfig?.supabase?.url ? publicConfig.supabase.url.slice(0, 30) + '...' : 'MISSING',
      hasSupabaseKey: !!publicConfig?.supabase?.key,
      hasServiceRoleKey: !!config.supabaseServiceRoleKey,
      cookiePrefix: publicConfig?.supabase?.cookiePrefix || 'NOT SET',
    },
    cookies: getHeader(event, 'cookie') ? getHeader(event, 'cookie')!.split(';').map(c => c.trim().split('=')[0]) : [],
  }

  // Test serverSupabaseUser
  try {
    const user = await serverSupabaseUser(event)
    diagnostics.user = user ? { id: user.id, email: (user as any).email || (user as any).sub } : null
  } catch (e: any) {
    diagnostics.userError = e?.message || String(e)
  }

  // Test serverSupabaseServiceRole (bypasses RLS)
  try {
    const { serverSupabaseServiceRole } = await import('#supabase/server')
    const srClient = serverSupabaseServiceRole(event)
    const { data, error } = await srClient.from('workspaces').select('id').limit(1)
    diagnostics.dbServiceRole = error ? { error: error.message } : { count: data?.length || 0 }
  } catch (e: any) {
    diagnostics.dbServiceRoleError = e?.message || String(e)
  }

  // Test anon client (goes through RLS)
  try {
    const client = await serverSupabaseClient(event)
    const { data, error } = await (client as any).from('workspaces').select('id').limit(1)
    diagnostics.dbAnon = error ? { error: error.message } : { count: data?.length || 0 }
  } catch (e: any) {
    diagnostics.dbAnonError = e?.message || String(e)
  }

  return diagnostics
})
