<template>
  <div>
    <NuxtLayout name="auth">
      <div class="animate-fade-up">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ t.welcomeBack }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">{{ t.loginSubtitle }}</p>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <UFormField :label="t.email">
            <UInput v-model="email" type="email" placeholder="tu@email.com" required class="w-full" size="lg" />
          </UFormField>

          <UFormField :label="t.password">
            <UInput v-model="password" type="password" :placeholder="t.enterPassword" required class="w-full" size="lg" />
          </UFormField>

          <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <UButton type="submit" block size="lg" :loading="loading" color="primary" class="font-semibold">
            {{ t.signInBtn }}
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
          <UButton block size="lg" variant="outline" icon="i-simple-icons-google" @click="handleGoogleLogin" class="font-medium">
            Google
          </UButton>
          <UButton block size="lg" variant="outline" icon="i-simple-icons-ethereum" @click="handleWalletLogin" :loading="walletLoading" class="font-medium">
            {{ t.connectWallet || 'Web3 Wallet' }}
          </UButton>
        </div>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          {{ t.noAccount }}
          <NuxtLink to="/auth/register" class="text-focusflow-600 hover:text-focusflow-500 dark:text-focusflow-400 dark:hover:text-focusflow-300 font-medium transition-colors">
            {{ t.createAccountBtn }}
          </NuxtLink>
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
const { labels: t } = useLanguage()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = computed(() => authLoading.value)
const walletLoading = computed(() => walletLoadingRef.value)

async function handleLogin() {
  errorMsg.value = ''
  try {
    await signIn(email.value, password.value)
    sessionStorage.setItem('focusflow_just_logged_in', '1')
    await new Promise(r => setTimeout(r, 500))
    await router.push('/')
  } catch (e: any) {
    errorMsg.value = e.message || t.value.loginError
  }
}

async function handleGoogleLogin() {
  try {
    await signInWithGoogle()
  } catch (e: any) {
    errorMsg.value = e.message || t.value.googleError
  }
}

async function handleWalletLogin() {
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
