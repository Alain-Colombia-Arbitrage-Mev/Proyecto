<template>
  <div>
    <NuxtLayout name="auth">
      <div class="animate-fade-up">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">{{ t.createYourAccount }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">{{ t.startManaging }}</p>

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
          <NuxtLink to="/auth/login" class="text-focusflow-600 hover:text-focusflow-500 dark:text-focusflow-400 dark:hover:text-focusflow-300 font-medium transition-colors">
            {{ t.signIn }}
          </NuxtLink>
        </p>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { signUp, signInWithGoogle, loading: authLoading } = useAuth()
const { signInWithWallet, hasWallet, loading: walletLoadingRef } = useWeb3Auth()
const router = useRouter()
const { labels: t } = useLanguage()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = computed(() => authLoading.value)
const walletLoading = computed(() => walletLoadingRef.value)

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

  try {
    await signUp(email.value, password.value)
    await router.push('/onboarding')
  } catch (e: any) {
    errorMsg.value = e.message || t.value.registerError
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
    await router.push('/onboarding')
  } catch (e: any) {
    errorMsg.value = e.message || 'Error connecting wallet'
  }
}
</script>
