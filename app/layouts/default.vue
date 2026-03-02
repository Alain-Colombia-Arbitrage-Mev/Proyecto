<template>
  <div class="min-h-screen bg-white">
    <!-- Desktop Sidebar -->
    <aside
      class="hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-white border-r border-gray-100 transition-all duration-300 ease-out"
      :class="collapsed ? 'w-[68px]' : 'w-[252px]'"
    >
      <!-- Logo + workspace -->
      <div class="h-14 flex items-center gap-2.5 shrink-0 border-b border-gray-100" :class="collapsed ? 'px-4 justify-center' : 'px-4'">
        <div class="w-8 h-8 rounded-lg bg-focusflow-600 flex items-center justify-center shrink-0">
          <span class="text-white font-bold text-sm" style="font-family: 'Space Mono', monospace;">F</span>
        </div>
        <div v-if="!collapsed" class="min-w-0">
          <p class="font-semibold text-[13px] text-gray-900 truncate leading-tight">{{ store.workspace?.name || 'FocusFlow' }}</p>
          <p class="text-[10px] text-gray-400 truncate">{{ store.slug }}</p>
        </div>
      </div>

      <!-- Main nav -->
      <nav class="py-3 space-y-0.5" :class="collapsed ? 'px-2' : 'px-3'">
        <NuxtLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-focusflow-50 hover:text-gray-900 transition-all duration-150"
          :class="collapsed ? 'px-0 py-2 justify-center' : 'px-2.5 py-2'"
          active-class="!bg-focusflow-50 !text-focusflow-700 font-semibold"
        >
          <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
          <span v-if="!collapsed">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="mx-4 border-t border-gray-100" />

      <!-- Projects section -->
      <div class="flex-1 overflow-y-auto py-3" :class="collapsed ? 'px-2' : 'px-3'">
        <div v-if="!collapsed" class="flex items-center justify-between px-2.5 pb-2">
          <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Proyectos</span>
          <button
            class="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-focusflow-600 hover:bg-focusflow-50 transition-all"
            @click="$emit('create-project')"
            title="Nuevo proyecto"
          >
            <UIcon name="i-heroicons-plus" class="w-3 h-3" />
          </button>
        </div>

        <div class="space-y-0.5">
          <NuxtLink
            v-for="project in store.projects"
            :key="project.id"
            :to="`/${store.slug}/projects/${project.id}/kanban`"
            class="group flex items-center gap-2.5 rounded-lg text-[13px] text-gray-500 hover:bg-focusflow-50 hover:text-gray-900 transition-all duration-150"
            :class="[
              collapsed ? 'px-0 py-2 justify-center' : 'px-2.5 py-1.5',
              isActiveProject(project.id) ? '!bg-focusflow-50 !text-focusflow-700 font-semibold' : '',
            ]"
          >
            <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: project.color }" />
            <span v-if="!collapsed" class="truncate">{{ project.name }}</span>
          </NuxtLink>

          <div v-if="store.projects.length === 0 && !collapsed" class="px-2.5 py-3">
            <p class="text-[11px] text-gray-400">Sin proyectos</p>
          </div>
        </div>
      </div>

      <!-- Notifications + user + collapse -->
      <div class="border-t border-gray-100">
        <div v-if="!collapsed" class="px-3 pt-2">
          <NotificationBell />
        </div>
        <div v-else class="flex justify-center pt-2">
          <NotificationBell />
        </div>
        <div class="flex items-center gap-2 p-2" :class="collapsed ? 'justify-center' : ''">
          <NuxtLink
            :to="`/${store.slug}/settings`"
            class="flex items-center gap-2.5 flex-1 rounded-lg hover:bg-focusflow-50 transition-all duration-150"
            :class="collapsed ? 'p-1.5 justify-center' : 'px-2.5 py-2'"
          >
            <div class="w-7 h-7 rounded-full bg-focusflow-100 text-focusflow-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              {{ auth.userInitials }}
            </div>
            <div v-if="!collapsed" class="min-w-0">
              <p class="text-xs font-medium text-gray-700 truncate">{{ auth.userEmail }}</p>
              <p v-if="auth.isSuperadmin" class="text-[9px] font-bold text-focusflow-600 uppercase tracking-wider">Superadmin</p>
              <p v-else-if="auth.isOwner" class="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Owner</p>
              <p v-else-if="auth.isAdmin" class="text-[9px] font-bold text-sky-600 uppercase tracking-wider">Admin</p>
            </div>
          </NuxtLink>
          <button
            v-if="!collapsed"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
            @click="collapsed = true"
          >
            <UIcon name="i-heroicons-chevron-double-left-20-solid" class="w-3.5 h-3.5" />
          </button>
          <button
            v-if="collapsed"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            @click="collapsed = false"
          >
            <UIcon name="i-heroicons-chevron-double-right-20-solid" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header class="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-focusflow-600 flex items-center justify-center">
          <span class="text-white font-bold text-xs" style="font-family: 'Space Mono', monospace;">F</span>
        </div>
        <span class="font-semibold text-sm text-gray-900 truncate">{{ store.workspace?.name || 'FocusFlow' }}</span>
      </div>
      <NotificationBell />
    </header>

    <!-- Main Content -->
    <main
      class="transition-all duration-300 ease-out"
      :class="[
        'md:pt-0 pt-14 pb-20 md:pb-0',
        collapsed ? 'md:pl-[68px]' : 'md:pl-[252px]',
      ]"
    >
      <div class="p-5 md:p-8 max-w-7xl">
        <slot />
      </div>
    </main>

    <!-- Lofi Player -->
    <LofiPlayer />

    <!-- Mobile Bottom Nav -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100">
      <div class="flex items-stretch justify-around h-14 px-1">
        <NuxtLink
          v-for="item in mobileNav"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center gap-0.5 min-w-0 px-1 text-gray-400 transition-colors"
          active-class="!text-focusflow-600"
        >
          <UIcon :name="item.icon" class="w-5 h-5" />
          <span class="text-[9px] font-semibold truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
      <div class="h-[env(safe-area-inset-bottom)]" />
    </nav>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const store = useWorkspaceStore()
const auth = useAuthStore()

const collapsed = ref(false)

const workspaceSlug = computed(() => (route.params.workspace as string) || '')

watch(workspaceSlug, async (slug) => {
  if (slug) {
    await store.loadWorkspace(slug)
    // Load user's role for this workspace
    if (store.workspace?.id) {
      await auth.loadRole(store.workspace.id)
    }
  }
}, { immediate: true })

watch(() => route.params.id as string, (id) => {
  store.setCurrentProject(id || null)
}, { immediate: true })

const mainNav = computed(() => [
  { label: 'Dashboard', icon: 'i-heroicons-squares-2x2', to: `/${workspaceSlug.value}/dashboard` },
  { label: 'Proyectos', icon: 'i-heroicons-folder-open', to: `/${workspaceSlug.value}/projects` },
  { label: 'AI Agents', icon: 'i-heroicons-cpu-chip', to: `/${workspaceSlug.value}/agents` },
  { label: 'Archivos', icon: 'i-heroicons-document-duplicate', to: `/${workspaceSlug.value}/files` },
  { label: 'Equipo', icon: 'i-heroicons-user-group', to: `/${workspaceSlug.value}/team` },
  { label: 'Ajustes', icon: 'i-heroicons-cog-6-tooth', to: `/${workspaceSlug.value}/settings` },
])

const mobileNav = computed(() => [
  { label: 'Home', icon: 'i-heroicons-squares-2x2', to: `/${workspaceSlug.value}/dashboard` },
  { label: 'Proyectos', icon: 'i-heroicons-folder-open', to: `/${workspaceSlug.value}/projects` },
  { label: 'AI Agents', icon: 'i-heroicons-cpu-chip', to: `/${workspaceSlug.value}/agents` },
  { label: 'Archivos', icon: 'i-heroicons-document-duplicate', to: `/${workspaceSlug.value}/files` },
  { label: 'Ajustes', icon: 'i-heroicons-cog-6-tooth', to: `/${workspaceSlug.value}/settings` },
])

function isActiveProject(projectId: string) {
  return route.params.id === projectId
}
</script>
