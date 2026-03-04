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
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Space+Mono:wght@400;700&display=swap',
        },
      ],
    },
  },
  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/auth/register'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
  },
  runtimeConfig: {
    supabaseServiceRoleKey: '',
    openrouterApiKey: '',
    amazonSesIamUser: '',
    amazonEmailFrom: '',
    amazonSmtpEndpoint: '',
    amazonSmtpPort: '',
    amazonSmtpUser: '',
    amazonSmtpPassword: '',
    cronSecret: '',
    context7Key: '',
    firebaseServiceAccountJson: '',
    public: {
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
  },
  devtools: { enabled: true },
})
