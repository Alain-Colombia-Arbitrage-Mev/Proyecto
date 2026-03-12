export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxtjs/supabase'],
  components: [
    { path: '~/components/inspira', prefix: 'Inspira', pathPrefix: false },
    { path: '~/components', pathPrefix: false },
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png',
        },
        {
          rel: 'apple-touch-icon',
          href: '/logo.png',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'preload',
          as: 'style',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=Space+Grotesk:wght@400;500;600;700&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=Space+Grotesk:wght@400;500;600;700&display=swap',
          media: 'print',
          onload: "this.media='all'",
        },
      ],
    },
  },
  supabase: {
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '',
    secretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/auth/register', '/legal/*'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax' as const,
      secure: true,
    },
  },
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '',
    supabase: { secretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
    openrouterApiKey: '',
    amazonSesIamUser: '',
    amazonEmailFrom: '',
    amazonSmtpEndpoint: '',
    amazonSmtpPort: '',
    amazonSmtpUser: '',
    amazonSmtpPassword: '',
    cronSecret: '',
    context7Key: '',
    n8nBaseUrl: '',
    n8nApiKey: '',
    firebaseServiceAccountJson: '',
    appUrl: process.env.NUXT_APP_URL || '',
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || '',
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        vapidKey: '',
      },
    },
  },
  colorMode: { preference: 'system', fallback: 'light', classSuffix: '' },
  vite: {
    optimizeDeps: {
      exclude: ['@vueuse/core', '@vueuse/shared'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // Separate heavy libs into their own chunks
            if (id.includes('node_modules/@tiptap')) return 'tiptap'
            if (id.includes('node_modules/date-fns')) return 'date-fns'
            if (id.includes('node_modules/@supabase')) return 'supabase'
            if (id.includes('node_modules/zod')) return 'zod'
          },
        },
      },
    },
  },
  experimental: {
    payloadExtraction: true,
    treeshakeClientOnly: true,
  },
  devtools: { enabled: true },
  devServer: { port: 3001 }, // solo desarrollo local — v2
})
