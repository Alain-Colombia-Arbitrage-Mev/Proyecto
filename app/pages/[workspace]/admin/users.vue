<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-2 mb-1">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
          <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ t.adminPanel }}</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t.adminPanelDesc }}</p>
        </div>
      </div>
    </div>

    <!-- Access denied -->
    <div v-if="!auth.isSuperadmin" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-8 text-center">
      <UIcon name="i-heroicons-shield-exclamation" class="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p class="text-sm font-medium text-red-700 dark:text-red-400">Superadmin access required</p>
    </div>

    <template v-else>
      <!-- Stats cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.totalUsers }}</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
        </div>
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.activeToday }}</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ stats.activeToday }}</p>
        </div>
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.withWorkspace }}</p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{{ stats.withWorkspace }}</p>
        </div>
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.noWorkspace }}</p>
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{{ stats.noWorkspace }}</p>
        </div>
      </div>

      <!-- Search -->
      <div class="relative">
        <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
        <input
          v-model="search"
          :placeholder="t.searchUsers"
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-focusflow-500/40 transition-all"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div class="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-focusflow-500 rounded-full animate-spin" />
          <span class="text-sm">{{ t.loadingUsers }}</span>
        </div>
      </div>

      <!-- Users table -->
      <div v-else-if="filteredUsers.length > 0" class="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <!-- Desktop table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-white/[0.06]">
                <th class="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Email</th>
                <th class="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.workspacesLabel }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.membersLabel }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.projectsLabel }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.tasksAssigned }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.completed }}</th>
                <th class="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.lastLogin }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in paginatedUsers"
                :key="u.id"
                class="border-b border-gray-50 dark:border-white/[0.04] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                :class="expandedUser === u.id ? 'bg-focusflow-50/30 dark:bg-focusflow-500/5' : ''"
              >
                <td class="px-4 py-3">
                  <button class="flex items-center gap-2.5 cursor-pointer group" @click="toggleExpand(u.id)">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      :class="u.totalWorkspaces > 0 ? 'bg-focusflow-100 dark:bg-focusflow-500/15 text-focusflow-700 dark:text-focusflow-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'"
                    >
                      {{ u.email.slice(0, 2).toUpperCase() }}
                    </div>
                    <div class="min-w-0 text-left">
                      <p class="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[220px] group-hover:text-focusflow-600 dark:group-hover:text-focusflow-400 transition-colors">{{ u.email }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ t.registeredOn }} {{ formatDate(u.created_at) }}</p>
                    </div>
                    <UIcon
                      name="i-heroicons-chevron-right-20-solid"
                      class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 transition-transform duration-200"
                      :class="expandedUser === u.id ? 'rotate-90' : ''"
                    />
                  </button>
                  <!-- Expanded workspace details -->
                  <Transition name="expand">
                    <div v-if="expandedUser === u.id && u.workspaces.length > 0" class="mt-2 ml-10 space-y-1.5">
                      <div
                        v-for="ws in u.workspaces"
                        :key="ws.id"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
                      >
                        <div class="w-6 h-6 rounded-md bg-focusflow-500/10 flex items-center justify-center shrink-0">
                          <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5 text-focusflow-500" />
                        </div>
                        <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{{ ws.name }}</span>
                        <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          :class="roleBadge(ws.role)">{{ ws.role }}</span>
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 ml-auto">{{ ws.memberCount }} {{ t.membersLabel.toLowerCase() }} / {{ ws.projectCount }} {{ t.projectsLabel.toLowerCase() }}</span>
                      </div>
                    </div>
                  </Transition>
                </td>
                <td class="px-4 py-3 text-center">
                  <span v-if="u.totalWorkspaces > 0" class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5" />
                    {{ u.totalWorkspaces }}
                  </span>
                  <span v-else class="text-[10px] text-gray-500 dark:text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ totalMembers(u) }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ totalProjects(u) }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs font-semibold" :class="u.tasks.total > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'">{{ u.tasks.total }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div v-if="u.tasks.total > 0" class="flex items-center justify-center gap-1.5">
                    <div class="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${Math.round((u.tasks.completed / u.tasks.total) * 100)}%` }" />
                    </div>
                    <span class="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{{ u.tasks.completed }}</span>
                  </div>
                  <span v-else class="text-[10px] text-gray-500 dark:text-gray-400">—</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-[11px]" :class="isRecentLogin(u.last_sign_in_at) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400'">
                    {{ u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : t.never }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="md:hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
          <div
            v-for="u in paginatedUsers"
            :key="u.id"
            class="p-4 space-y-2"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                :class="u.totalWorkspaces > 0 ? 'bg-focusflow-100 dark:bg-focusflow-500/15 text-focusflow-700 dark:text-focusflow-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'"
              >
                {{ u.email.slice(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ u.email }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ t.registeredOn }} {{ formatDate(u.created_at) }}</p>
              </div>
              <span class="text-[10px] shrink-0" :class="isRecentLogin(u.last_sign_in_at) ? 'text-emerald-500 font-medium' : 'text-gray-500 dark:text-gray-400'">
                {{ u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : t.never }}
              </span>
            </div>

            <div class="flex items-center gap-3 text-[10px] pl-11">
              <span class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <UIcon name="i-heroicons-building-office" class="w-3 h-3" /> {{ u.totalWorkspaces }}
              </span>
              <span class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-3 h-3" /> {{ u.tasks.total }} {{ t.tasksAssigned.toLowerCase() }}
              </span>
              <span v-if="u.tasks.completed > 0" class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3" /> {{ u.tasks.completed }}
              </span>
            </div>

            <!-- Workspace pills -->
            <div v-if="u.workspaces.length > 0" class="flex flex-wrap gap-1 pl-11">
              <span
                v-for="ws in u.workspaces"
                :key="ws.id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[9px] font-medium text-gray-600 dark:text-gray-400"
              >
                {{ ws.name }}
                <span class="px-1 py-px rounded-full text-[8px] font-bold uppercase" :class="roleBadge(ws.role)">{{ ws.role }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
          <p class="text-[10px] text-gray-500 dark:text-gray-400">
            {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredUsers.length) }} / {{ filteredUsers.length }}
          </p>
          <div class="flex items-center gap-1">
            <button
              :disabled="currentPage <= 1"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors cursor-pointer"
              @click="currentPage--"
            >
              <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
            </button>
            <span class="text-xs font-medium text-gray-600 dark:text-gray-300 px-2">{{ currentPage }} / {{ totalPages }}</span>
            <button
              :disabled="currentPage >= totalPages"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors cursor-pointer"
              @click="currentPage++"
            >
              <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
        <UIcon name="i-heroicons-users" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.noUsersFound }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const store = useWorkspaceStore()
const lang = useLanguage()
const t = lang.labels

interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  workspaces: Array<{
    id: string
    name: string
    slug: string
    role: string
    memberCount: number
    projectCount: number
  }>
  tasks: { total: number; completed: number; in_progress: number }
  totalWorkspaces: number
}

const users = ref<AdminUser[]>([])
const loading = ref(true)
const search = ref('')
const expandedUser = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 25

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return users.value
  return users.value.filter(u => u.email.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

// Reset page on search
watch(search, () => { currentPage.value = 1 })

const stats = computed(() => {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  return {
    total: users.value.length,
    activeToday: users.value.filter(u => u.last_sign_in_at && (now - new Date(u.last_sign_in_at).getTime()) < dayMs).length,
    withWorkspace: users.value.filter(u => u.totalWorkspaces > 0).length,
    noWorkspace: users.value.filter(u => u.totalWorkspaces === 0).length,
  }
})

function toggleExpand(id: string) {
  expandedUser.value = expandedUser.value === id ? null : id
}

function totalMembers(u: AdminUser) {
  if (u.workspaces.length === 0) return 0
  return u.workspaces.reduce((sum, ws) => sum + ws.memberCount, 0)
}

function totalProjects(u: AdminUser) {
  if (u.workspaces.length === 0) return 0
  return u.workspaces.reduce((sum, ws) => sum + ws.projectCount, 0)
}

function roleBadge(role: string) {
  if (role === 'owner') return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
  if (role === 'admin') return 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400'
  if (role === 'superadmin') return 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
  return 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(lang.language.value === 'en' ? 'en-US' : 'es-CO', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t.value.now || 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

function isRecentLogin(d: string | null) {
  if (!d) return false
  return (Date.now() - new Date(d).getTime()) < 24 * 60 * 60 * 1000
}

async function loadUsers() {
  if (!auth.isSuperadmin) return
  loading.value = true
  try {
    const data = await $fetch<{ total: number; users: AdminUser[] }>('/api/admin/users')
    users.value = data.users
  } catch (e) {
    console.error('Failed to load admin users:', e)
  }
  loading.value = false
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to {
  max-height: 300px;
}
</style>
