<template>
  <div>
    <NuxtLayout name="auth">
      <div class="animate-fade-up">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ t.createYourAccount }}</h2>
        <p class="text-sm text-gray-500 mb-8">{{ t.startManaging }}</p>

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

          <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <UButton type="submit" block size="lg" :loading="loading" color="primary" class="font-semibold">
            {{ t.createAccountBtn }}
          </UButton>
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-100" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white px-3 text-gray-400">{{ t.orContinueWith }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2.5">
          <UButton block size="lg" variant="outline" icon="i-simple-icons-google" @click="handleGoogleRegister" class="font-medium">
            Google
          </UButton>
          <UButton v-if="walletAvailable" block size="lg" variant="outline" icon="i-heroicons-wallet" @click="handleWalletRegister" :loading="walletLoading" class="font-medium">
            {{ t.connectWallet || 'Web3 Wallet' }}
          </UButton>
        </div>

        <p class="text-center text-sm text-gray-500 mt-8">
          {{ t.alreadyHaveAccount }}
          <NuxtLink to="/auth/login" class="text-focusflow-700 hover:text-focusflow-700 font-medium transition-colors">
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
const walletAvailable = ref(false)
onMounted(() => { walletAvailable.value = hasWallet() })

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
  try {
    await signInWithWallet()
    await router.push('/onboarding')
  } catch (e: any) {
    errorMsg.value = e.message || 'Error connecting wallet'
  }
}
</script>
