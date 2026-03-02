<template>
  <div class="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-focusflow-100/40 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-focusflow-50/50 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-lg px-4 py-12">
      <!-- Header -->
      <div class="text-center mb-10 animate-fade-up">
        <div class="w-14 h-14 rounded-2xl bg-focusflow-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-focusflow-100">
          <span class="text-white font-bold text-xl" style="font-family: 'Space Mono', monospace;">F</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
          Configura tu espacio
        </h1>
        <p class="mt-2 text-gray-500">
          Solo necesitas un nombre para empezar
        </p>
      </div>

      <!-- Steps indicator -->
      <div class="flex items-center justify-center gap-2 mb-8 animate-fade-up delay-100">
        <div
          v-for="s in 3"
          :key="s"
          class="h-1 rounded-full transition-all duration-300"
          :class="s <= step ? 'bg-focusflow-500 w-8' : 'bg-gray-200 w-4'"
        />
      </div>

      <!-- Step 1: Workspace name -->
      <div v-if="step === 1" class="animate-fade-up delay-200">
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <label class="block text-sm font-semibold text-gray-900 mb-3">
            Nombre de tu workspace
          </label>
          <UInput
            v-model="workspaceName"
            placeholder="Ej: Mi Empresa, Equipo Dev..."
            required
            class="w-full"
            size="xl"
            autofocus
            @keydown.enter="workspaceName && (step = 2)"
          />
          <p class="text-xs text-gray-400 mt-2">Este será el nombre de tu espacio de trabajo</p>
        </div>
        <UButton
          block
          size="xl"
          color="primary"
          class="mt-4 font-semibold"
          :disabled="!workspaceName.trim()"
          @click="step = 2"
        >
          Continuar
        </UButton>
      </div>

      <!-- Step 2: Project name -->
      <div v-if="step === 2" class="animate-fade-up">
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <label class="block text-sm font-semibold text-gray-900 mb-3">
            Tu primer proyecto
          </label>
          <UInput
            v-model="projectName"
            placeholder="Ej: App Mobile, API v2..."
            required
            class="w-full"
            size="xl"
            autofocus
            @keydown.enter="projectName && (step = 3)"
          />
          <p class="text-xs text-gray-400 mt-2">Puedes crear más proyectos después</p>
        </div>
        <div class="flex gap-3 mt-4">
          <UButton block variant="ghost" size="lg" @click="step = 1">Atrás</UButton>
          <UButton block size="lg" color="primary" class="font-semibold" :disabled="!projectName.trim()" @click="step = 3">
            Continuar
          </UButton>
        </div>
      </div>

      <!-- Step 3: Template -->
      <div v-if="step === 3" class="animate-fade-up">
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <label class="block text-sm font-semibold text-gray-900 mb-4">
            Tipo de tablero Kanban
          </label>
          <div class="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
            <button
              v-for="tpl in templateOptions"
              :key="tpl.value"
              class="w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer"
              :class="template === tpl.value
                ? 'border-focusflow-400 bg-focusflow-50/60 shadow-sm'
                : 'border-gray-100 hover:border-focusflow-200 hover:bg-gray-50'"
              @click="template = tpl.value"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-gray-900">{{ tpl.label }}</span>
                <span class="text-[9px] font-semibold text-gray-400">{{ tpl.cols }} columnas</span>
              </div>
              <div class="flex gap-1 flex-wrap">
                <span
                  v-for="col in tpl.columns"
                  :key="col.title"
                  class="text-[8px] font-semibold px-1.5 py-0.5 rounded"
                  :style="{ backgroundColor: col.color + '18', color: col.color }"
                >{{ col.title }}</span>
              </div>
            </button>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <UButton block variant="ghost" size="lg" @click="step = 2">Atrás</UButton>
          <UButton block size="lg" color="primary" class="font-semibold" :loading="creating" @click="handleCreate">
            Crear workspace
          </UButton>
        </div>
        <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3 text-center">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const router = useRouter()

const step = ref(1)
const workspaceName = ref('')
const projectName = ref('')
const template = ref('simple')
const errorMsg = ref('')
const creating = ref(false)

const templateOptions = [
  {
    label: 'Simple', value: 'simple', cols: 3,
    columns: [
      { title: 'Pendiente', color: '#3B82F6' },
      { title: 'En Progreso', color: '#F59E0B' },
      { title: 'Hecho', color: '#10B981' },
    ],
  },
  {
    label: 'Kanban Clásico', value: 'kanban', cols: 5,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'To Do', color: '#3B82F6' },
      { title: 'En Progreso', color: '#F59E0B' },
      { title: 'Revisión', color: '#8B5CF6' },
      { title: 'Hecho', color: '#10B981' },
    ],
  },
  {
    label: 'Desarrollo IT', value: 'dev', cols: 6,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Análisis', color: '#8B5CF6' },
      { title: 'Dev', color: '#3B82F6' },
      { title: 'Code Review', color: '#F59E0B' },
      { title: 'QA', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
    ],
  },
  {
    label: 'DevOps', value: 'devops', cols: 8,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Diseño', color: '#8B5CF6' },
      { title: 'Desarrollo', color: '#3B82F6' },
      { title: 'Code Review', color: '#6366F1' },
      { title: 'CI/CD', color: '#F59E0B' },
      { title: 'Staging', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
      { title: 'Monitoreo', color: '#14B8A6' },
    ],
  },
  {
    label: 'Soporte', value: 'support', cols: 6,
    columns: [
      { title: 'Nuevo', color: '#3B82F6' },
      { title: 'Triaje', color: '#6366F1' },
      { title: 'Asignado', color: '#8B5CF6' },
      { title: 'En Proceso', color: '#F59E0B' },
      { title: 'Esperando', color: '#F97316' },
      { title: 'Cerrado', color: '#10B981' },
    ],
  },
  {
    label: 'Scrum', value: 'scrum', cols: 6,
    columns: [
      { title: 'Product Backlog', color: '#6B7280' },
      { title: 'Sprint Backlog', color: '#6366F1' },
      { title: 'En Progreso', color: '#3B82F6' },
      { title: 'En Review', color: '#F59E0B' },
      { title: 'QA', color: '#8B5CF6' },
      { title: 'Done', color: '#10B981' },
    ],
  },
  {
    label: 'Scrumban', value: 'scrumban', cols: 8,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Listo para Pull', color: '#6366F1' },
      { title: 'En Progreso', color: '#3B82F6' },
      { title: 'Review', color: '#F59E0B' },
      { title: 'Testing', color: '#8B5CF6' },
      { title: 'Deploy', color: '#F97316' },
      { title: 'Done', color: '#10B981' },
      { title: 'Archivado', color: '#9CA3AF' },
    ],
  },
]

// On mount, check if user already has workspaces (they shouldn't be here)
onMounted(async () => {
  try {
    const existing = await $fetch<any[]>('/api/user/workspaces')
    if (existing && existing.length > 0) {
      console.log('[onboarding] User already has workspaces, redirecting...')
      await router.replace(`/${existing[0].slug}/projects`)
    }
  } catch { /* user might not be authenticated yet */ }
})

async function handleCreate() {
  errorMsg.value = ''
  creating.value = true

  try {
    // First check if user already has a workspace (prevent duplicates)
    let existingWorkspaces: any[] = []
    try {
      existingWorkspaces = await $fetch<any[]>('/api/user/workspaces')
    } catch { /* ignore */ }

    let workspaceId: string
    let workspaceSlug: string

    if (existingWorkspaces.length > 0) {
      // Use existing workspace instead of creating another
      workspaceId = existingWorkspaces[0].id || existingWorkspaces[0].workspace_id
      workspaceSlug = existingWorkspaces[0].slug
      console.log('[onboarding] Using existing workspace:', workspaceSlug)
    } else {
      // Create new workspace
      const workspace = await $fetch<any>('/api/workspaces', {
        method: 'POST',
        body: { name: workspaceName.value },
      })
      workspaceId = workspace.id
      workspaceSlug = workspace.slug
    }

    // Create project in the workspace
    await $fetch(`/api/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: {
        name: projectName.value,
        kanban_template: template.value,
      },
    })

    await router.push(`/${workspaceSlug}/projects`)
  } catch (e: any) {
    errorMsg.value = e.data?.message || e.message || 'Error al crear el workspace'
    console.error('[onboarding] Error:', e.data || e.message)
  } finally {
    creating.value = false
  }
}
</script>
