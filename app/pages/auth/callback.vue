<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-focusflow-100 dark:bg-focusflow-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-focusflow-600 dark:text-focusflow-400 animate-spin" />
      </div>
      <p class="text-sm text-[var(--ui-text-muted)]">{{ errorMsg || 'Autenticando...' }}</p>
      <UButton v-if="errorMsg" to="/auth/login" variant="soft" size="sm">Volver al login</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const errorMsg = ref('')

onMounted(async () => {
  try {
    // The hash fragment contains access_token from OAuth providers.
    // @nuxtjs/supabase should auto-detect it, but we need to wait for the session.
    // If the hash has tokens, explicitly handle the exchange.
    if (import.meta.client && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          console.error('[callback] setSession error:', error.message)
          errorMsg.value = error.message
          return
        }
      }
    }

    // Wait for user to be available (max 5 seconds)
    let attempts = 0
    while (!user.value && attempts < 25) {
      await new Promise(r => setTimeout(r, 200))
      attempts++
    }

    if (!user.value) {
      // Try getting session one more time
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        errorMsg.value = 'No se pudo establecer la sesion'
        return
      }
    }

    sessionStorage.setItem('focusflow_just_logged_in', '1')

    // Invitations are handled via InvitationBanner — no auto-accept
    await router.replace('/')
  } catch (err: any) {
    console.error('[callback] Error:', err)
    errorMsg.value = err.message || 'Error de autenticacion'
  }
})
</script>
