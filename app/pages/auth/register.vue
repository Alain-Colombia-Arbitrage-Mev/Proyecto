<template>
  <div>
    <NuxtLayout name="auth">
      <div class="animate-fade-up">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ t.createYourAccount }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ t.startManaging }}</p>

        <!-- Invitation banner -->
        <div v-if="inviteInfo" class="mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
          <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <UIcon name="i-heroicons-envelope" class="w-5 h-5 shrink-0" />
            <div class="text-sm">
              <p class="font-semibold">{{ lang.language.value === 'en' ? `You're invited to "${inviteInfo.workspace}"` : `Te invitaron a "${inviteInfo.workspace}"` }}</p>
              <p class="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                {{ lang.language.value === 'en' ? `Role: ${inviteInfo.role} · By ${inviteInfo.invitedBy}` : `Rol: ${inviteInfo.role} · Por ${inviteInfo.invitedBy}` }}
              </p>
            </div>
          </div>
        </div>
        <div v-else-if="inviteId" class="mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
          <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <UIcon name="i-heroicons-envelope" class="w-5 h-5 shrink-0" />
            <p class="text-sm font-medium">{{ lang.language.value === 'en' ? 'You have a workspace invitation! Create your account to join.' : 'Tienes una invitacion a un workspace. Crea tu cuenta para unirte.' }}</p>
          </div>
        </div>

        <form class="space-y-5" @submit.prevent="handleRegister">
          <UFormField :label="t.email">
            <UInput v-model="email" type="email" placeholder="tu@email.com" required class="w-full" size="lg" />
          </UFormField>

          <UFormField :label="t.password">
            <UInput v-model="password" type="password" :placeholder="t.minChars" required class="w-full" size="lg" />
          </UFormField>

          <UFormField :label="t.confirmPassword">
            <UInput v-model="confirmPassword" type="password" :placeholder="t.repeatPassword" required class="w-full" size="lg" />
          </UFormField>

          <p v-if="successMsg" class="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 rounded-lg px-3 py-2">{{ successMsg }}</p>
          <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <UButton type="submit" block size="lg" :loading="loading" color="primary" class="font-semibold">
            {{ t.createAccountBtn }}
          </UButton>
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white dark:bg-gray-950 px-3 text-gray-400 dark:text-gray-500">{{ t.orContinueWith }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2.5">
          <UButton block size="lg" variant="outline" icon="i-simple-icons-google" @click="handleGoogleRegister" class="font-medium">
            Google
          </UButton>
          <UButton block size="lg" variant="outline" icon="i-simple-icons-ethereum" @click="handleWalletRegister" :loading="walletLoading" class="font-medium">
            {{ t.connectWallet || 'Web3 Wallet' }}
          </UButton>
        </div>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          {{ t.alreadyHaveAccount }}
          <NuxtLink :to="inviteId ? `/auth/login?invite=${inviteId}&email=${encodeURIComponent(email)}` : '/auth/login'" class="text-focusflow-600 hover:text-focusflow-500 dark:text-focusflow-400 dark:hover:text-focusflow-300 font-medium transition-colors">
            {{ t.signIn }}
          </NuxtLink>
        </p>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { signInWithGoogle, loading: authLoading } = useAuth()
const { signInWithWallet, hasWallet, loading: walletLoadingRef } = useWeb3Auth()
const router = useRouter()
const lang = useLanguage()
const t = lang.labels

const route = useRoute()
const email = ref((route.query.email as string) || '')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const inviteId = computed(() => (route.query.invite as string) || '')
const registering = ref(false)
const loading = computed(() => authLoading.value || registering.value)
const walletLoading = computed(() => walletLoadingRef.value)

// Invitation details for rich banner
const inviteInfo = ref<{ workspace: string; role: string; invitedBy: string } | null>(null)

// Persist inviteId so index.vue can process it after redirect
watch(inviteId, (id) => {
  if (import.meta.client && id) sessionStorage.setItem('focusflow_invite_id', id)
}, { immediate: true })

// Load invitation details
async function loadInviteInfo() {
  if (!inviteId.value) return
  try {
    const data = await $fetch<any>(`/api/auth/invitation-info`, { params: { id: inviteId.value } })
    if (data?.workspace_name) {
      inviteInfo.value = { workspace: data.workspace_name, role: data.role, invitedBy: data.invited_by_name }
    }
  } catch { /* invitation may not exist or be expired */ }
}

onMounted(loadInviteInfo)

async function handleRegister() {
  errorMsg.value = ''

  if (password.value !== confirmPassword.value) {
    errorMsg.value = t.value.passwordsMismatch
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = t.value.passwordTooShort
    return
  }

  registering.value = true
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error

    // If email confirmation required (session is null), show message
    if (data?.user && !data.session) {
      successMsg.value = lang.language.value === 'en'
        ? 'Check your email to confirm your account, then sign in.'
        : 'Revisa tu correo para confirmar tu cuenta, luego inicia sesion.'
      return
    }

    sessionStorage.setItem('focusflow_just_logged_in', '1')

    // For invited users: wait for session to be ready, then accept invitation
    if (inviteId.value) {
      // Wait for auth cookie to propagate (signUp just happened)
      await new Promise(r => setTimeout(r, 1000))
      // Retry accept-invitation up to 3 times
      for (let i = 0; i < 3; i++) {
        try {
          const result = await $fetch<any>('/api/auth/accept-invitation', {
            method: 'POST',
            body: { inviteId: inviteId.value, email: email.value },
          })
          if (result?.processed) break
        } catch {}
        if (i < 2) await new Promise(r => setTimeout(r, 800))
      }
    }
    await router.push('/')
  } catch (e: any) {
    errorMsg.value = e.message || t.value.registerError
  } finally {
    registering.value = false
  }
}

async function handleGoogleRegister() {
  try {
    await signInWithGoogle()
  } catch (e: any) {
    errorMsg.value = e.message || t.value.googleError
  }
}

async function handleWalletRegister() {
  errorMsg.value = ''
  if (!hasWallet()) {
    errorMsg.value = t.value.installWallet || 'Install MetaMask or a compatible Web3 wallet to continue.'
    return
  }
  try {
    await signInWithWallet()
    sessionStorage.setItem('focusflow_just_logged_in', '1')
    if (inviteId.value) {
      try {
        await $fetch('/api/auth/accept-invitation', {
          method: 'POST',
          body: { inviteId: inviteId.value, email: email.value },
        })
      } catch {}
    }
    await router.push('/')
  } catch (e: any) {
    errorMsg.value = e.message || 'Error connecting wallet'
  }
}
</script>
