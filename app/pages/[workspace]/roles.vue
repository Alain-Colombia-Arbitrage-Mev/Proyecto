<template>
  <div>
    <div class="flex items-center justify-between mb-6 animate-fade-up">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ t.rolesTitle }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ t.rolesDescription }}</p>
      </div>
      <UButton v-if="hasChanges" color="primary" :loading="saving" class="font-semibold" @click="savePermissions">
        {{ t.saveChanges }}
      </UButton>
    </div>

    <p v-if="savedMsg" class="text-sm text-emerald-600 dark:text-emerald-400 mb-4 animate-fade-up">{{ savedMsg }}</p>
    <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400 mb-4">{{ errorMsg }}</p>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ t.loading }}</span>
      </div>
    </div>

    <div v-else class="animate-fade-up delay-100">
      <!-- Permission groups -->
      <div v-for="group in permissionGroups" :key="group.key" class="mb-6">
        <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-card">
          <div class="px-6 py-3 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
            <h3 class="font-semibold text-sm text-gray-900 dark:text-white">{{ group.label }}</h3>
          </div>

          <!-- Header row -->
          <div class="grid px-6 py-2 border-b border-gray-200/80 dark:border-white/10 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500"
            :style="{ gridTemplateColumns: `1fr repeat(${roles.length}, 80px)` }">
            <span>{{ lang.language.value === 'en' ? 'Permission' : 'Permiso' }}</span>
            <span v-for="role in roles" :key="role" class="text-center">{{ roleLabel(role) }}</span>
          </div>

          <!-- Permission rows -->
          <div v-for="perm in group.perms" :key="perm"
            class="grid px-6 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
            :style="{ gridTemplateColumns: `1fr repeat(${roles.length}, 80px)` }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ permLabel(perm) }}</span>
            <div v-for="role in roles" :key="role" class="flex justify-center">
              <button
                v-if="role !== 'owner'"
                class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer"
                :class="matrix[role]?.[perm]
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'"
                @click="togglePermission(role, perm)"
              >
                <UIcon v-if="matrix[role]?.[perm]" name="i-heroicons-check" class="w-3 h-3" />
              </button>
              <div v-else class="w-5 h-5 rounded bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center" :title="lang.language.value === 'en' ? 'Owner has all permissions' : 'El owner tiene todos los permisos'">
                <UIcon name="i-heroicons-check" class="w-3 h-3 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky save bar -->
      <div v-if="hasChanges" class="sticky bottom-4 flex justify-end">
        <div class="bg-gray-900 dark:bg-white rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
          <span class="text-sm text-white dark:text-gray-900 font-medium">{{ lang.language.value === 'en' ? 'Unsaved changes' : 'Cambios sin guardar' }}</span>
          <UButton color="primary" size="sm" :loading="saving" class="font-semibold" @click="savePermissions">
            {{ t.save }}
          </UButton>
          <UButton variant="ghost" size="sm" class="text-white dark:text-gray-900" @click="resetChanges">
            {{ lang.language.value === 'en' ? 'Discard' : 'Descartar' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()
const lang = useLanguage()
const t = lang.labels

const loading = ref(true)
const saving = ref(false)
const savedMsg = ref('')
const errorMsg = ref('')

const roles = ref<string[]>([])
const permissions = ref<string[]>([])
const labels = ref<Record<string, { en: string; es: string }>>({})
const matrix = ref<Record<string, Record<string, boolean>>>({})
const originalOverrides = ref<Record<string, Record<string, boolean>>>({})
const currentOverrides = ref<Record<string, Record<string, boolean>>>({})

const hasChanges = computed(() => JSON.stringify(currentOverrides.value) !== JSON.stringify(originalOverrides.value))

const permissionGroups = computed(() => {
  const en = lang.language.value === 'en'
  const groups = [
    { key: 'tasks', label: en ? 'Tasks' : 'Tareas', prefixes: ['view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'import_tasks'] },
    { key: 'files', label: en ? 'Files' : 'Archivos', prefixes: ['view_files', 'upload_files', 'delete_files'] },
    { key: 'ai', label: 'AI', prefixes: ['use_ai_basic', 'use_ai_doc_agents'] },
    { key: 'meetings', label: en ? 'Meetings' : 'Reuniones', prefixes: ['view_meetings', 'create_meetings'] },
    { key: 'labels', label: en ? 'Labels' : 'Etiquetas', prefixes: ['manage_labels', 'delete_labels'] },
    { key: 'time', label: en ? 'Time & Reports' : 'Tiempo y Reportes', prefixes: ['view_timesheets', 'manage_timesheets', 'view_reports'] },
    { key: 'planning', label: en ? 'Planning' : 'Planificacion', prefixes: ['manage_sprints', 'view_goals', 'manage_goals', 'view_roadmap', 'view_agenda', 'manage_reserved_dates'] },
    { key: 'workflows', label: 'Workflows', prefixes: ['use_workflows', 'manage_workflows'] },
    { key: 'admin', label: en ? 'Administration' : 'Administracion', prefixes: ['manage_members', 'manage_comments', 'view_usage_stats', 'manage_workspace'] },
  ]
  return groups.map(g => ({
    ...g,
    perms: g.prefixes.filter(p => permissions.value.includes(p)),
  })).filter(g => g.perms.length > 0)
})

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    viewer: 'Viewer',
    marketing: 'Marketing',
    member: lang.language.value === 'en' ? 'Member' : 'Miembro',
    admin: 'Admin',
    owner: 'Owner',
  }
  return map[role] || role
}

function permLabel(perm: string): string {
  const l = labels.value[perm]
  if (!l) return perm
  return lang.language.value === 'en' ? l.en : l.es
}

function togglePermission(role: string, perm: string) {
  if (role === 'owner') return
  const current = matrix.value[role]?.[perm] ?? false
  const newVal = !current

  // Update matrix
  if (!matrix.value[role]) matrix.value[role] = {}
  matrix.value[role][perm] = newVal

  // Track override
  if (!currentOverrides.value[role]) currentOverrides.value[role] = {}
  currentOverrides.value[role][perm] = newVal
}

async function loadRoles() {
  loading.value = true
  errorMsg.value = ''
  try {
    if (!store.workspace?.id) {
      errorMsg.value = 'Workspace not loaded'
      return
    }
    const data = await $fetch<any>(`/api/workspaces/${store.workspace.id}/roles`)
    roles.value = data.roles
    permissions.value = data.permissions
    labels.value = data.labels
    matrix.value = data.matrix
    originalOverrides.value = JSON.parse(JSON.stringify(data.overrides))
    currentOverrides.value = JSON.parse(JSON.stringify(data.overrides))
  } catch (e: any) {
    errorMsg.value = e.message || 'Error loading roles'
  } finally {
    loading.value = false
  }
}

async function savePermissions() {
  saving.value = true
  savedMsg.value = ''
  errorMsg.value = ''
  try {
    await $fetch(`/api/workspaces/${store.workspace?.id}/roles`, {
      method: 'PUT',
      body: { overrides: currentOverrides.value },
    })
    originalOverrides.value = JSON.parse(JSON.stringify(currentOverrides.value))
    savedMsg.value = lang.language.value === 'en' ? 'Permissions saved successfully' : 'Permisos guardados correctamente'
    setTimeout(() => { savedMsg.value = '' }, 3000)
  } catch (e: any) {
    errorMsg.value = e.message || 'Error saving permissions'
  } finally {
    saving.value = false
  }
}

function resetChanges() {
  currentOverrides.value = JSON.parse(JSON.stringify(originalOverrides.value))
  loadRoles()
}

// Wait for workspace to be loaded, then fetch roles
watch(() => store.workspace?.id, (id) => {
  if (id) loadRoles()
}, { immediate: true })
</script>
