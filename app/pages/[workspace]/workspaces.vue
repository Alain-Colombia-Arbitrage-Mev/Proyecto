<template>
  <div class="animate-fade-up">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ lang.language.value === 'en' ? 'My Workspaces' : 'Mis Workspaces' }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ lang.language.value === 'en' ? 'Switch, manage or leave workspaces' : 'Cambiar, gestionar o abandonar workspaces' }}</p>
      </div>
      <UButton icon="i-heroicons-plus" size="sm" @click="showCreate = true">
        {{ lang.language.value === 'en' ? 'New' : 'Nuevo' }}
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-500 dark:text-gray-400 animate-spin" />
    </div>

    <!-- Workspace list -->
    <div v-else class="grid gap-3">
      <div
        v-for="ws in workspaces"
        :key="ws.id"
        class="bg-white dark:bg-[#1b1b1b] rounded-xl border transition-all"
        :class="ws.id === store.workspace?.id
          ? 'border-focusflow-300 dark:border-focusflow-500/40 shadow-sm shadow-focusflow-500/10'
          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'"
      >
        <div class="px-4 py-3 flex items-center gap-3">
          <!-- Avatar -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
            :class="ws.id === store.workspace?.id
              ? 'bg-focusflow-100 dark:bg-focusflow-500/20 text-focusflow-700 dark:text-focusflow-400'
              : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/50'"
          >
            {{ ws.name?.charAt(0)?.toUpperCase() || 'W' }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">{{ ws.name }}</p>
              <span
                class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                :class="roleClass(ws.role)"
              >{{ ws.role }}</span>
              <span v-if="ws.id === store.workspace?.id" class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-focusflow-100 dark:bg-focusflow-500/20 text-focusflow-700 dark:text-focusflow-400">
                {{ lang.language.value === 'en' ? 'Current' : 'Actual' }}
              </span>
            </div>
            <div class="flex items-center gap-3 mt-0.5">
              <p class="text-xs text-gray-400 dark:text-gray-500">{{ ws.slug }}</p>
              <div class="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                <span v-if="ws.projectCount != null" class="flex items-center gap-0.5">
                  <UIcon name="i-heroicons-folder-open" class="w-3 h-3" />
                  {{ ws.projectCount }}
                </span>
                <span v-if="ws.taskCount != null" class="flex items-center gap-0.5">
                  <UIcon name="i-heroicons-clipboard-document-list" class="w-3 h-3" />
                  {{ ws.taskCount }}
                </span>
                <span v-if="ws.memberCount != null" class="flex items-center gap-0.5">
                  <UIcon name="i-heroicons-users" class="w-3 h-3" />
                  {{ ws.memberCount }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Switch -->
            <UButton
              v-if="ws.id !== store.workspace?.id"
              variant="soft"
              size="xs"
              icon="i-heroicons-arrow-right-on-rectangle"
              @click="switchTo(ws)"
            >
              {{ lang.language.value === 'en' ? 'Switch' : 'Ir' }}
            </UButton>

            <!-- Leave (non-owner only) -->
            <UButton
              v-if="ws.role !== 'owner' && ws.role !== 'superadmin'"
              variant="ghost"
              size="xs"
              color="error"
              icon="i-heroicons-arrow-left-start-on-rectangle"
              :loading="leaving === ws.id"
              @click="confirmLeave(ws)"
            >
              {{ lang.language.value === 'en' ? 'Leave' : 'Salir' }}
            </UButton>

            <!-- Delete (owner/superadmin only) -->
            <UButton
              v-if="ws.role === 'owner' || auth.isSuperadmin"
              variant="ghost"
              size="xs"
              color="error"
              icon="i-heroicons-trash"
              :loading="deleting === ws.id"
              @click="confirmDelete(ws)"
            >
              {{ lang.language.value === 'en' ? 'Delete' : 'Eliminar' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="workspaces.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-building-office-2" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ lang.language.value === 'en' ? 'No workspaces found' : 'No se encontraron workspaces' }}</p>
      </div>
    </div>

    <!-- Create workspace modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCreate" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showCreate = false">
          <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ lang.language.value === 'en' ? 'Create Workspace' : 'Crear Workspace' }}</h3>
            <form @submit.prevent="createWorkspace">
              <UFormField :label="lang.language.value === 'en' ? 'Name' : 'Nombre'">
                <UInput v-model="newName" :placeholder="lang.language.value === 'en' ? 'My workspace' : 'Mi workspace'" required class="w-full" size="lg" />
              </UFormField>
              <div class="flex justify-end gap-2 mt-5">
                <UButton variant="ghost" @click="showCreate = false">{{ lang.language.value === 'en' ? 'Cancel' : 'Cancelar' }}</UButton>
                <UButton type="submit" :loading="creating">{{ lang.language.value === 'en' ? 'Create' : 'Crear' }}</UButton>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirm dialog -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="confirmAction" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="confirmAction = null">
          <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-sm mx-4 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <UIcon :name="confirmAction.type === 'delete' ? 'i-heroicons-trash' : 'i-heroicons-arrow-left-start-on-rectangle'" class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white">{{ confirmAction.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ confirmAction.message }}</p>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <UButton variant="ghost" @click="confirmAction = null">{{ lang.language.value === 'en' ? 'Cancel' : 'Cancelar' }}</UButton>
              <UButton color="error" :loading="confirmAction.loading" @click="executeAction">
                {{ confirmAction.type === 'delete'
                  ? (lang.language.value === 'en' ? 'Delete' : 'Eliminar')
                  : (lang.language.value === 'en' ? 'Leave' : 'Salir')
                }}
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const lang = useLanguage()
const store = useWorkspaceStore()
const auth = useAuthStore()
const router = useRouter()

interface WorkspaceItem {
  id: string
  name: string
  slug: string
  role: string
  workspace_id: string
  projectCount?: number
  taskCount?: number
  memberCount?: number
}

const workspaces = ref<WorkspaceItem[]>([])
const loading = ref(true)
const leaving = ref<string | null>(null)
const deleting = ref<string | null>(null)
const showCreate = ref(false)
const newName = ref('')
const creating = ref(false)

const confirmAction = ref<{
  type: 'delete' | 'leave'
  ws: WorkspaceItem
  title: string
  message: string
  loading: boolean
} | null>(null)

async function loadWorkspaces() {
  loading.value = true
  try {
    workspaces.value = await $fetch<WorkspaceItem[]>('/api/user/workspaces')
  } catch {}
  loading.value = false
}

function roleClass(role: string) {
  switch (role) {
    case 'superadmin': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
    case 'owner': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
    case 'admin': return 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400'
    default: return 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
  }
}

async function switchTo(ws: WorkspaceItem) {
  await router.push(`/${ws.slug}/dashboard`)
}

function confirmLeave(ws: WorkspaceItem) {
  confirmAction.value = {
    type: 'leave',
    ws,
    title: lang.language.value === 'en' ? `Leave "${ws.name}"?` : `Abandonar "${ws.name}"?`,
    message: lang.language.value === 'en'
      ? 'You will lose access to this workspace and its projects.'
      : 'Perderas acceso a este workspace y sus proyectos.',
    loading: false,
  }
}

function confirmDelete(ws: WorkspaceItem) {
  confirmAction.value = {
    type: 'delete',
    ws,
    title: lang.language.value === 'en' ? `Delete "${ws.name}"?` : `Eliminar "${ws.name}"?`,
    message: lang.language.value === 'en'
      ? 'This will permanently delete the workspace, all projects and tasks. This cannot be undone.'
      : 'Esto eliminara permanentemente el workspace, todos los proyectos y tareas. No se puede deshacer.',
    loading: false,
  }
}

async function executeAction() {
  if (!confirmAction.value) return
  const { type, ws } = confirmAction.value
  confirmAction.value.loading = true

  try {
    if (type === 'leave') {
      leaving.value = ws.id
      await $fetch(`/api/workspaces/${ws.id}/leave`, { method: 'POST' })
    } else {
      deleting.value = ws.id
      await $fetch(`/api/workspaces/${ws.id}`, { method: 'DELETE' })
    }

    workspaces.value = workspaces.value.filter(w => w.id !== ws.id)

    // If we left/deleted the current workspace, redirect to first available
    if (ws.id === store.workspace?.id) {
      const next = workspaces.value[0]
      if (next) {
        await router.push(`/${next.slug}/dashboard`)
      } else {
        await router.push('/onboarding')
      }
    }
  } catch (e: any) {
    console.error(`[workspaces] ${type} error:`, e)
  } finally {
    leaving.value = null
    deleting.value = null
    confirmAction.value = null
  }
}

async function createWorkspace() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const ws = await $fetch<any>('/api/workspaces', {
      method: 'POST',
      body: { name: newName.value.trim() },
    })
    showCreate.value = false
    newName.value = ''
    await router.push(`/${ws.slug}/dashboard`)
  } catch (e: any) {
    console.error('[workspaces] create error:', e)
  } finally {
    creating.value = false
  }
}

onMounted(loadWorkspaces)
</script>
