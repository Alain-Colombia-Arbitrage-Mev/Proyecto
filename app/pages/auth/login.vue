<template>
  <div>
    <NuxtLayout name="auth">
      <div class="animate-fade-up">
        <!-- Tab switcher -->
        <div class="mb-7 flex rounded-lg border border-white/60 bg-white/42 p-1 shadow-inner shadow-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/10">
          <button
            class="flex-1 rounded-md py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
            :class="mode === 'login'
              ? 'bg-white/95 dark:bg-white/12 text-gray-900 dark:text-white shadow-sm ring-1 ring-white/75 dark:ring-white/10'
              : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'"
            @click="switchMode('login')"
          >
            {{ t.signIn }}
          </button>
          <button
            class="flex-1 rounded-md py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
            :class="mode === 'register'
              ? 'bg-white/95 dark:bg-white/12 text-gray-900 dark:text-white shadow-sm ring-1 ring-white/75 dark:ring-white/10'
              : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'"
            @click="switchMode('register')"
          >
            {{ t.createAccountBtn }}
          </button>
        </div>

        <!-- Invitation banner -->
        <div v-if="inviteInfo" class="mb-6 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <UIcon name="i-heroicons-envelope" class="w-5 h-5 shrink-0" />
            <div class="text-sm">
              <p class="font-semibold">{{ lang.language.value === 'en' ? `You're invited to "${inviteInfo.workspace}"` : `Te invitaron a "${inviteInfo.workspace}"` }}</p>
              <p class="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                <template v-if="inviteInfo.role">
                  {{ lang.language.value === 'en' ? `Role: ${inviteInfo.role}` : `Rol: ${inviteInfo.role}` }}
                  <template v-if="inviteInfo.invitedBy"> · {{ lang.language.value === 'en' ? `By ${inviteInfo.invitedBy}` : `Por ${inviteInfo.invitedBy}` }}</template>
                </template>
                <template v-else>
                  {{ lang.language.value === 'en' ? 'Sign in or create an account to join' : 'Inicia sesion o crea una cuenta para unirte' }}
                </template>
              </p>
            </div>
          </div>
        </div>

        <!-- ========== LOGIN FORM ========== -->
        <div v-if="mode === 'login'">
          <div class="mb-5">
            <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-focusflow-600/80 dark:text-focusflow-300/70">{{ lang.language.value === 'en' ? 'Sign in' : 'Acceso' }}</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white" style="font-family: 'Space Grotesk', sans-serif;">{{ t.welcomeBack }}</h2>
            <p class="mt-1.5 text-sm text-gray-500 dark:text-white/45">{{ t.loginSubtitle }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleLogin">
            <UFormField :label="t.email">
              <UInput v-model="email" type="email" placeholder="tu@email.com" required class="w-full" size="lg" />
            </UFormField>

            <UFormField :label="t.password">
              <UInput v-model="password" type="password" :placeholder="t.enterPassword" required class="w-full" size="lg" />
            </UFormField>

            <p v-if="errorMsg" class="rounded-lg border border-red-200/70 bg-red-50/70 px-3 py-2 text-sm text-red-600 backdrop-blur-xl dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{{ errorMsg }}</p>

            <UButton type="submit" block size="lg" :loading="loading" color="primary" class="mt-1 font-bold shadow-lg shadow-focusflow-500/25">
              {{ t.signInBtn }}
            </UButton>
          </form>
        </div>

        <!-- ========== REGISTER FORM ========== -->
        <div v-else>
          <div class="mb-5">
            <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-focusflow-600/80 dark:text-focusflow-300/70">{{ lang.language.value === 'en' ? 'New workspace' : 'Nuevo acceso' }}</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white" style="font-family: 'Space Grotesk', sans-serif;">{{ t.createYourAccount }}</h2>
            <p class="mt-1.5 text-sm text-gray-500 dark:text-white/45">{{ t.startManaging }}</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleRegister">
            <UFormField :label="t.email">
              <UInput v-model="email" type="email" placeholder="tu@email.com" required class="w-full" size="lg" />
            </UFormField>

            <UFormField :label="t.password">
              <UInput v-model="password" type="password" :placeholder="t.minChars" required class="w-full" size="lg" />
            </UFormField>

            <UFormField :label="t.confirmPassword">
              <UInput v-model="confirmPassword" type="password" :placeholder="t.repeatPassword" required class="w-full" size="lg" />
            </UFormField>

            <p v-if="successMsg" class="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-600 backdrop-blur-xl dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">{{ successMsg }}</p>
            <p v-if="errorMsg" class="rounded-lg border border-red-200/70 bg-red-50/70 px-3 py-2 text-sm text-red-600 backdrop-blur-xl dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{{ errorMsg }}</p>

            <UButton type="submit" block size="lg" :loading="loading" color="primary" class="mt-1 font-bold shadow-lg shadow-focusflow-500/25">
              {{ t.createAccountBtn }}
            </UButton>
          </form>
        </div>

        <!-- Social login / OAuth -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-white/60 dark:border-white/10" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="rounded-full border border-white/55 bg-white/70 px-3 py-1 font-medium text-gray-500 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:text-white/42">{{ t.orContinueWith }}</span>
          </div>
        </div>

        <div class="grid gap-2.5 sm:grid-cols-2">
          <UButton block size="lg" variant="outline" icon="i-simple-icons-google" @click="handleGoogle" class="border-white/60 bg-white/45 font-semibold shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.045]">
            Google
          </UButton>
          <UButton block size="lg" variant="outline" icon="i-simple-icons-ethereum" @click="handleWallet" :loading="walletLoading" class="border-white/60 bg-white/45 font-semibold shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.045]">
            {{ t.connectWallet || 'Web3 Wallet' }}
          </UButton>
        </div>

        <!-- Legal -->
        <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6 leading-relaxed">
          <template v-if="mode === 'register'">
            {{ lang.language.value === 'en' ? 'By creating an account, you agree to our ' : 'Al crear una cuenta, aceptas nuestros ' }}
            <NuxtLink to="/legal/terms" class="text-focusflow-600 dark:text-focusflow-400 hover:underline">{{ lang.language.value === 'en' ? 'Terms & Conditions' : 'Terminos y Condiciones' }}</NuxtLink>
            {{ lang.language.value === 'en' ? ' and ' : ' y ' }}
            <NuxtLink to="/legal/privacy" class="text-focusflow-600 dark:text-focusflow-400 hover:underline">{{ lang.language.value === 'en' ? 'Privacy Policy' : 'Politica de Privacidad' }}</NuxtLink>.
          </template>
          <template v-else>
            <NuxtLink to="/legal/terms" class="text-focusflow-600 dark:text-focusflow-400 hover:underline">{{ lang.language.value === 'en' ? 'Terms & Conditions' : 'Terminos y Condiciones' }}</NuxtLink>
            <span class="mx-1.5">&middot;</span>
            <NuxtLink to="/legal/privacy" class="text-focusflow-600 dark:text-focusflow-400 hover:underline">{{ lang.language.value === 'en' ? 'Privacy Policy' : 'Politica de Privacidad' }}</NuxtLink>
          </template>
        </p>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { signIn, signInWithGoogle, loading: authLoading } = useAuth()
const { signInWithWallet, hasWallet, loading: walletLoadingRef } = useWeb3Auth()
const router = useRouter()
const route = useRoute()
const lang = useLanguage()
const t = lang.labels

const email = ref((route.query.email as string) || '')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const registering = ref(false)
const loading = computed(() => authLoading.value || registering.value)
const walletLoading = computed(() => walletLoadingRef.value)

const mode = ref<'login' | 'register'>((route.query.mode as string) === 'register' ? 'register' : 'login')

function switchMode(m: 'login' | 'register') {
  mode.value = m
  errorMsg.value = ''
  successMsg.value = ''
  // Update URL without navigation
  const query = { ...route.query, mode: m === 'register' ? 'register' : undefined }
  router.replace({ query })
}

// Invitation support
const inviteId = computed(() => (route.query.invite as string) || '')
const inviteInfo = ref<{ workspace: string; role?: string; invitedBy?: string } | null>(null)

watch(inviteId, (id) => {
  if (import.meta.client && id) sessionStorage.setItem('focusflow_invite_id', id)
}, { immediate: true })

async function loadInviteInfo() {
  if (!inviteId.value) return
  try {
    const data = await $fetch<any>('/api/auth/invitation-info', { params: { id: inviteId.value } })
    if (data?.workspace_name) {
      inviteInfo.value = {
        workspace: data.workspace_name,
        role: data.role,
        invitedBy: data.invited_by_name,
      }
    }
  } catch {}
}

onMounted(loadInviteInfo)

// ---- Login ----
async function handleLogin() {
  errorMsg.value = ''
  try {
    await signIn(email.value, password.value)
    sessionStorage.setItem('focusflow_just_logged_in', '1')
    await router.push('/')
  } catch (e: any) {
    errorMsg.value = e.message || t.value.loginError
  }
}

// ---- Register ----
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

    if (data?.user && !data.session) {
      successMsg.value = lang.language.value === 'en'
        ? 'Check your email to confirm your account, then sign in.'
        : 'Revisa tu correo para confirmar tu cuenta, luego inicia sesion.'
      return
    }

    sessionStorage.setItem('focusflow_just_logged_in', '1')
    await router.push('/')
  } catch (e: any) {
    errorMsg.value = e.message || t.value.registerError
  } finally {
    registering.value = false
  }
}

// ---- OAuth / Web3 (shared) ----
async function handleGoogle() {
  errorMsg.value = ''
  try {
    await signInWithGoogle()
  } catch (e: any) {
    errorMsg.value = e.message || t.value.googleError
  }
}

async function handleWallet() {
  errorMsg.value = ''
  if (!hasWallet()) {
    errorMsg.value = t.value.installWallet || 'Install MetaMask or a compatible Web3 wallet to continue.'
    return
  }
  try {
    await signInWithWallet()
    sessionStorage.setItem('focusflow_just_logged_in', '1')
    await new Promise(r => setTimeout(r, 500))
    await router.push('/')
  } catch (e: any) {
    errorMsg.value = e.message || 'Error connecting wallet'
  }
}
</script>
