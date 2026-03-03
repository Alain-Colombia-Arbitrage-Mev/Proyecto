<template>
  <div>
    <NuxtLayout name="auth">
      <div class="animate-fade-up">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ t.welcomeBack }}</h2>
        <p class="text-sm text-gray-500 mb-8">{{ t.loginSubtitle }}</p>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <UFormField :label="t.email">
            <UInput v-model="email" type="email" placeholder="tu@email.com" required class="w-full" size="lg" />
          </UFormField>

          <UFormField :label="t.password">
            <UInput v-model="password" type="password" :placeholder="t.enterPassword" required class="w-full" size="lg" />
          </UFormField>

          <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <UButton type="submit" block size="lg" :loading="loading" color="primary" class="font-semibold">
            {{ t.signInBtn }}
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

        <UButton block size="lg" variant="outline" icon="i-simple-icons-google" @click="handleGoogleLogin" class="font-medium">
          Google
        </UButton>

        <p class="text-center text-sm text-gray-500 mt-8">
          {{ t.noAccount }}
          <NuxtLink to="/auth/register" class="text-focusflow-700 hover:text-focusflow-700 font-medium transition-colors">
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
const router = useRouter()
const { labels: t } = useLanguage()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = computed(() => authLoading.value)

async function handleLogin() {
  errorMsg.value = ''
  try {
    await signIn(email.value, password.value)
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
</script>
