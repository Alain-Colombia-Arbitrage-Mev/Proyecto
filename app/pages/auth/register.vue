<template>
  <div>
    <NuxtLayout name="auth">
      <div class="animate-fade-up">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">Crea tu cuenta</h2>
        <p class="text-sm text-gray-500 mb-8">Empieza a gestionar tus proyectos hoy</p>

        <form class="space-y-5" @submit.prevent="handleRegister">
          <UFormField label="Email">
            <UInput v-model="email" type="email" placeholder="tu@email.com" required class="w-full" size="lg" />
          </UFormField>

          <UFormField label="Contraseña">
            <UInput v-model="password" type="password" placeholder="Mínimo 6 caracteres" required class="w-full" size="lg" />
          </UFormField>

          <UFormField label="Confirmar contraseña">
            <UInput v-model="confirmPassword" type="password" placeholder="Repetir contraseña" required class="w-full" size="lg" />
          </UFormField>

          <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <UButton type="submit" block size="lg" :loading="loading" color="primary" class="font-semibold">
            Crear cuenta
          </UButton>
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-100" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white px-3 text-gray-400">o continua con</span>
          </div>
        </div>

        <UButton block size="lg" variant="outline" icon="i-simple-icons-google" @click="handleGoogleRegister" class="font-medium">
          Google
        </UButton>

        <p class="text-center text-sm text-gray-500 mt-8">
          ¿Ya tienes cuenta?
          <NuxtLink to="/auth/login" class="text-focusflow-700 hover:text-focusflow-700 font-medium transition-colors">
            Inicia sesión
          </NuxtLink>
        </p>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { signUp, signInWithGoogle, loading: authLoading } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = computed(() => authLoading.value)

async function handleRegister() {
  errorMsg.value = ''

  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden'
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  try {
    await signUp(email.value, password.value)
    await router.push('/onboarding')
  } catch (e: any) {
    errorMsg.value = e.message || 'Error al registrarse'
  }
}

async function handleGoogleRegister() {
  try {
    await signInWithGoogle()
  } catch (e: any) {
    errorMsg.value = e.message || 'Error con Google'
  }
}
</script>
