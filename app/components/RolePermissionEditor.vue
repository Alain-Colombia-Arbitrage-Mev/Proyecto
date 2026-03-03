<template>
  <UModal v-model:open="isOpen" class="sm:max-w-3xl w-full">
    <template #content>
      <div class="flex flex-col max-h-[85vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ lang.language.value === 'en' ? 'Role Permissions' : 'Permisos por Rol' }}</h2>
            <p class="text-xs text-gray-500 mt-0.5">{{ lang.language.value === 'en' ? 'Customize what each role can do' : 'Personaliza qué puede hacer cada rol' }}</p>
          </div>
          <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>

        <!-- Permission matrix -->
        <div class="flex-1 overflow-auto px-6 py-4">
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] sticky left-0 bg-white min-w-[160px]">
                    {{ lang.language.value === 'en' ? 'Permission' : 'Permiso' }}
                  </th>
                  <th
                    v-for="role in editableRoles"
                    :key="role"
                    class="text-center py-2 px-2 font-semibold uppercase tracking-wider text-[10px] min-w-[80px]"
                    :class="roleHeaderClass(role)"
                  >
                    {{ roleDisplayName(role) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="perm in allPermissions"
                  :key="perm"
                  class="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td class="py-2 pr-4 text-[11px] text-gray-700 font-medium sticky left-0 bg-white">
                    {{ permLabel(perm) }}
                  </td>
                  <td
                    v-for="role in editableRoles"
                    :key="role"
                    class="text-center py-2 px-2"
                  >
                    <button
                      v-if="canToggle(role, perm)"
                      class="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer mx-auto"
                      :class="localPerms[role]?.[perm]
                        ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-500'"
                      @click="togglePerm(role, perm)"
                    >
                      <UIcon :name="localPerms[role]?.[perm] ? 'i-heroicons-check' : 'i-heroicons-x-mark'" class="w-3.5 h-3.5" />
                    </button>
                    <span v-else class="text-emerald-500 text-xs">
                      <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 mx-auto" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Reset to defaults -->
          <div class="mt-4 flex items-center gap-3">
            <button
              class="text-[11px] text-gray-500 hover:text-red-500 font-medium cursor-pointer transition-colors"
              @click="resetToDefaults"
            >
              {{ lang.language.value === 'en' ? 'Reset to defaults' : 'Restaurar valores por defecto' }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-100">
          <UButton variant="ghost" @click="isOpen = false">{{ t.cancel }}</UButton>
          <UButton color="primary" :loading="saving" class="font-semibold" @click="handleSave">{{ t.save }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ALL_PERMISSIONS, ALL_ROLES, PERMISSION_LABELS, getRolePermissions } from '~/composables/usePermissions'

const lang = useLanguage()
const t = lang.labels
const store = useWorkspaceStore()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const saving = ref(false)
const allPermissions = ALL_PERMISSIONS

// Roles that can be edited (not owner/superadmin - they always have full access)
const editableRoles = ['viewer', 'marketing', 'member', 'admin', 'owner'] as const

// Local state: full permission matrix
const localPerms = ref<Record<string, Record<string, boolean>>>({})

// Initialize from workspace config
watch(() => props.open, (val) => {
  if (val) loadCurrentPerms()
})

function loadCurrentPerms() {
  const overrides = (store.workspace as any)?.ai_config?.role_permissions as Record<string, Record<string, boolean>> | undefined
  const result: Record<string, Record<string, boolean>> = {}

  for (const role of editableRoles) {
    result[role] = {}
    const defaults = getRolePermissions(role, overrides)
    for (const perm of allPermissions) {
      result[role][perm] = defaults[perm]
    }
  }
  localPerms.value = result
}

function canToggle(role: string, _perm: string): boolean {
  // Owner always has all except manage_workspace which is inherent
  if (role === 'owner') return false
  return true
}

function togglePerm(role: string, perm: string) {
  if (!localPerms.value[role]) localPerms.value[role] = {}
  localPerms.value[role][perm] = !localPerms.value[role][perm]
}

function resetToDefaults() {
  const result: Record<string, Record<string, boolean>> = {}
  for (const role of editableRoles) {
    result[role] = {}
    const defaults = getRolePermissions(role) // no overrides = pure defaults
    for (const perm of allPermissions) {
      result[role][perm] = defaults[perm]
    }
  }
  localPerms.value = result
}

function permLabel(perm: string): string {
  const labels = PERMISSION_LABELS[perm as keyof typeof PERMISSION_LABELS]
  if (!labels) return perm
  return lang.language.value === 'en' ? labels.en : labels.es
}

function roleDisplayName(role: string): string {
  const map: Record<string, string> = {
    viewer: t.value.viewer,
    marketing: 'Marketing',
    member: t.value.member,
    admin: t.value.admin,
    owner: t.value.owner,
  }
  return map[role] || role
}

function roleHeaderClass(role: string): string {
  const map: Record<string, string> = {
    viewer: 'text-gray-400',
    marketing: 'text-pink-600',
    member: 'text-gray-600',
    admin: 'text-sky-600',
    owner: 'text-amber-600',
  }
  return map[role] || 'text-gray-600'
}

async function handleSave() {
  if (!store.workspace?.id) return
  saving.value = true

  // Build overrides: only store diffs from default
  const overrides: Record<string, Record<string, boolean>> = {}
  for (const role of editableRoles) {
    if (role === 'owner') continue // owner always has all
    const defaults = getRolePermissions(role) // pure defaults
    const diffs: Record<string, boolean> = {}
    let hasDiffs = false

    for (const perm of allPermissions) {
      const current = localPerms.value[role]?.[perm] ?? defaults[perm]
      if (current !== defaults[perm]) {
        diffs[perm] = current
        hasDiffs = true
      }
    }
    if (hasDiffs) overrides[role] = diffs
  }

  try {
    // Update workspace ai_config with role_permissions
    const currentConfig = (store.workspace as any)?.ai_config || {}
    await $fetch(`/api/workspaces/${store.workspace.id}`, {
      method: 'PATCH',
      body: {
        ai_config: {
          ...currentConfig,
          role_permissions: Object.keys(overrides).length > 0 ? overrides : undefined,
        },
      },
    })

    // Reload workspace to reflect changes
    if (store.slug) await store.loadWorkspace(store.slug)
    isOpen.value = false
    emit('saved')
  } catch (e: any) {
    alert(e.data?.message || 'Error saving permissions')
  } finally {
    saving.value = false
  }
}
</script>
