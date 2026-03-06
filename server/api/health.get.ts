export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const publicConfig = config.public as any

  return {
    ok: true,
    env: {
      hasSupabaseUrl: !!publicConfig?.supabase?.url,
      supabaseUrl: publicConfig?.supabase?.url ? publicConfig.supabase.url.slice(0, 30) + '...' : 'MISSING',
      hasSupabaseKey: !!publicConfig?.supabase?.key,
      hasServiceRoleKey: !!config.supabaseServiceRoleKey,
      cookiePrefix: publicConfig?.supabase?.cookiePrefix || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      host: process.env.HOST || 'NOT SET',
      port: process.env.PORT || 'NOT SET',
    },
    cookies: getHeader(event, 'cookie') ? getHeader(event, 'cookie')!.split(';').map(c => c.trim().split('=')[0]) : [],
  }
})
