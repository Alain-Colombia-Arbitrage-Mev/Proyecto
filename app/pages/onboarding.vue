<template>
  <div class="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-focusflow-100/40 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-focusflow-50/50 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-lg px-4 py-12">
      <!-- Pending invitations banner -->
      <div v-if="pendingInvitations.length > 0" class="mb-8 animate-fade-up">
        <div
          v-for="inv in pendingInvitations"
          :key="inv.id"
          class="mb-3 bg-white rounded-2xl border border-focusflow-200 shadow-lg shadow-focusflow-100/30 overflow-hidden"
        >
          <div class="px-5 py-4">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-focusflow-100 flex items-center justify-center shrink-0 mt-0.5">
                <UIcon name="i-heroicons-envelope-open" class="w-5 h-5 text-focusflow-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900">
                  {{ lang.language.value === 'en' ? 'Workspace Invitation' : 'Invitacion a Workspace' }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  <span v-if="inv.invited_by_name" class="font-medium text-gray-700">{{ inv.invited_by_name }}</span>
                  {{ lang.language.value === 'en' ? ' invited you to' : ' te invito a' }}
                  <span class="font-semibold text-focusflow-600"> {{ inv.workspace_name }}</span>
                  <span class="text-gray-400"> ({{ inv.role }})</span>
                </p>
                <div class="flex items-center gap-2 mt-3">
                  <UButton
                    size="sm"
                    color="primary"
                    class="font-semibold"
                    :loading="respondingId === inv.id"
                    @click="acceptInvitation(inv)"
                  >
                    {{ lang.language.value === 'en' ? 'Join Workspace' : 'Unirme al Workspace' }}
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    color="neutral"
                    @click="declineInvitation(inv)"
                  >
                    {{ lang.language.value === 'en' ? 'Decline' : 'Rechazar' }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white px-3 text-gray-400">{{ lang.language.value === 'en' ? 'or create a new workspace' : 'o crea un nuevo workspace' }}</span>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="text-center mb-10 animate-fade-up">
        <div class="w-14 h-14 rounded-2xl bg-focusflow-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-focusflow-100">
          <span class="text-white font-bold text-xl" style="font-family: 'Space Grotesk', monospace;">F</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
          {{ t.setupWorkspace }}
        </h1>
        <p class="mt-2 text-gray-500">
          {{ t.justAName }}
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
            {{ t.workspaceName }}
          </label>
          <UInput
            v-model="workspaceNameInput"
            :placeholder="t.workspacePlaceholder"
            required
            class="w-full"
            size="xl"
            autofocus
            @keydown.enter="workspaceNameInput && (step = 2)"
          />
          <p class="text-xs text-gray-500 mt-2">{{ t.workspaceHint }}</p>
        </div>
        <UButton
          block
          size="xl"
          color="primary"
          class="mt-4 font-semibold"
          :disabled="!workspaceNameInput.trim()"
          @click="step = 2"
        >
          {{ t.continueBtn }}
        </UButton>
      </div>

      <!-- Step 2: Project name -->
      <div v-if="step === 2" class="animate-fade-up">
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <label class="block text-sm font-semibold text-gray-900 mb-3">
            {{ t.firstProject }}
          </label>
          <UInput
            v-model="projectName"
            :placeholder="t.projectPlaceholder"
            required
            class="w-full"
            size="xl"
            autofocus
            @keydown.enter="projectName && (step = 3)"
          />
          <p class="text-xs text-gray-500 mt-2">{{ t.moreProjectsLater }}</p>
        </div>
        <div class="flex gap-3 mt-4">
          <UButton block variant="ghost" size="lg" @click="step = 1">{{ t.back }}</UButton>
          <UButton block size="lg" color="primary" class="font-semibold" :disabled="!projectName.trim()" @click="step = 3">
            {{ t.continueBtn }}
          </UButton>
        </div>
      </div>

      <!-- Step 3: Template -->
      <div v-if="step === 3" class="animate-fade-up">
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
          <label class="block text-sm font-semibold text-gray-900 mb-4">
            {{ t.kanbanType }}
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
                <span class="text-[9px] font-semibold text-gray-500">{{ tpl.cols }} {{ t.columns }}</span>
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
          <UButton block variant="ghost" size="lg" @click="step = 2">{{ t.back }}</UButton>
          <UButton block size="lg" color="primary" class="font-semibold" :loading="creating" @click="handleCreate">
            {{ t.createWorkspace }}
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
const lang = useLanguage()
const { labels: t } = lang

const step = ref(1)
const workspaceNameInput = ref('')
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
  {
    label: 'App Development', value: 'app_development', cols: 8,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Diseño UX/UI', color: '#EC4899' },
      { title: 'Desarrollo', color: '#3B82F6' },
      { title: 'Code Review', color: '#6366F1' },
      { title: 'QA / Testing', color: '#F59E0B' },
      { title: 'Beta', color: '#F97316' },
      { title: 'Release', color: '#10B981' },
      { title: 'Post-Launch', color: '#14B8A6' },
    ],
  },
]

interface PendingInvitation {
  id: string
  workspace_id: string
  workspace_name: string
  workspace_slug: string
  role: string
  invited_by_name: string
  created_at: string
}

const pendingInvitations = ref<PendingInvitation[]>([])
const respondingId = ref('')

async function loadPendingInvitations() {
  try {
    pendingInvitations.value = await $fetch<PendingInvitation[]>('/api/auth/pending-invitations')
  } catch {}
}

async function acceptInvitation(inv: PendingInvitation) {
  respondingId.value = inv.id
  try {
    const result = await $fetch<any>('/api/auth/respond-invitation', {
      method: 'POST',
      body: { inviteId: inv.id, action: 'accept' },
    })
    if (result?.workspace_id && inv.workspace_slug) {
      await router.push(`/${inv.workspace_slug}/dashboard`)
    } else {
      // Fallback: re-check workspaces
      const workspaces = await $fetch<any[]>('/api/user/workspaces')
      if (workspaces?.length > 0) {
        await router.push(`/${workspaces[0].slug}/dashboard`)
      }
    }
  } catch (e: any) {
    console.error('[onboarding] Accept invitation error:', e)
  } finally {
    respondingId.value = ''
  }
}

async function declineInvitation(inv: PendingInvitation) {
  try {
    await $fetch('/api/auth/respond-invitation', {
      method: 'POST',
      body: { inviteId: inv.id, action: 'decline' },
    })
    pendingInvitations.value = pendingInvitations.value.filter(i => i.id !== inv.id)
  } catch {}
}

onMounted(async () => {
  try {
    const existing = await $fetch<any[]>('/api/user/workspaces')
    if (existing && existing.length > 0) {
      await router.replace(`/${existing[0].slug}/projects`)
      return
    }
  } catch {}
  // Load pending invitations if user has no workspaces
  await loadPendingInvitations()
})

async function handleCreate() {
  errorMsg.value = ''
  creating.value = true

  try {
    let existingWorkspaces: any[] = []
    try {
      existingWorkspaces = await $fetch<any[]>('/api/user/workspaces')
    } catch {}

    let workspaceId: string
    let workspaceSlug: string

    if (existingWorkspaces.length > 0) {
      workspaceId = existingWorkspaces[0].id || existingWorkspaces[0].workspace_id
      workspaceSlug = existingWorkspaces[0].slug
    } else {
      const workspace = await $fetch<any>('/api/workspaces', {
        method: 'POST',
        body: { name: workspaceNameInput.value },
      })
      workspaceId = workspace.id
      workspaceSlug = workspace.slug
    }

    await $fetch(`/api/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: {
        name: projectName.value,
        kanban_template: template.value,
      },
    })

    await router.push(`/${workspaceSlug}/projects`)
  } catch (e: any) {
    errorMsg.value = e.data?.message || e.message || t.value.errorCreatingWorkspace
  } finally {
    creating.value = false
  }
}
</script>
