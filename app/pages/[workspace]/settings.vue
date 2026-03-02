<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-8 animate-fade-up">Ajustes</h1>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Cargando...</span>
      </div>
    </div>

    <div v-else class="space-y-6 max-w-2xl animate-fade-up delay-100">
      <!-- Workspace settings -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="font-bold text-gray-900">Workspace</h2>
          <p class="text-xs text-gray-500 mt-0.5">Configuración general del espacio de trabajo</p>
        </div>
        <div class="p-6 space-y-4">
          <UFormField label="Nombre">
            <UInput v-model="wsName" class="w-full" size="lg" />
          </UFormField>
          <UFormField label="Slug (URL)">
            <UInput :model-value="wsSlug" disabled class="w-full opacity-60" />
          </UFormField>
          <div class="flex justify-end">
            <UButton color="primary" :loading="savingWs" class="font-semibold" @click="saveWorkspace">
              Guardar cambios
            </UButton>
          </div>
          <p v-if="wsSaved" class="text-sm text-emerald-700">Guardado correctamente</p>
        </div>
      </div>

      <!-- Profile -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="font-bold text-gray-900">Tu perfil</h2>
          <p class="text-xs text-gray-500 mt-0.5">Información de tu cuenta</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-focusflow-100 text-focusflow-800 flex items-center justify-center font-bold text-xl">
              {{ userInitials }}
            </div>
            <div>
              <p class="font-semibold text-gray-900">{{ currentUser?.email }}</p>
              <p class="text-xs text-gray-500">{{ memberRole }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-red-100">
          <h2 class="font-bold text-red-600">Zona de peligro</h2>
          <p class="text-xs text-gray-500 mt-0.5">Acciones irreversibles</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-sm text-gray-900">Cerrar sesión</p>
              <p class="text-xs text-gray-500">Salir de tu cuenta en este dispositivo</p>
            </div>
            <UButton variant="outline" color="error" size="sm" @click="handleLogout">
              Cerrar sesión
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const router = useRouter()
const store = useWorkspaceStore()
const auth = useAuthStore()
const currentUser = useSupabaseUser()
const supabase = useSupabaseClient()

const loading = ref(true)
const wsName = ref('')
const wsSlug = ref('')
const savingWs = ref(false)
const wsSaved = ref(false)
const memberRole = ref('member')

const userInitials = computed(() => auth.userInitials)

onMounted(async () => {
  try {
    if (!store.workspace) return
    wsName.value = store.workspace.name
    wsSlug.value = store.workspace.slug

    const members = await $fetch<any[]>(`/api/workspaces/${store.workspace.id}/members`)
    const me = members?.find(m => m.user_id === currentUser.value?.id)
    if (me) memberRole.value = me.role
  } catch { } finally {
    loading.value = false
  }
})

async function saveWorkspace() {
  savingWs.value = true
  wsSaved.value = false
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}`, {
      method: 'PATCH',
      body: { name: wsName.value },
    })
    wsSaved.value = true
    setTimeout(() => { wsSaved.value = false }, 3000)
  } catch { } finally {
    savingWs.value = false
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
  await router.push('/auth/login')
}
</script>
