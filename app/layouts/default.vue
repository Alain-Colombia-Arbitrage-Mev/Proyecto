<template>
  <div class="min-h-screen bg-[#f8f9fb] dark:bg-[#111] transition-colors">
    <!-- Desktop Sidebar -->
    <aside
      class="hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-[#0d0d0d]/80 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ease-out"
      :class="collapsed ? 'w-[68px]' : 'w-[252px]'"
    >
      <!-- Logo + workspace -->
      <div class="h-14 flex items-center gap-2.5 shrink-0 border-b border-white/[0.06]" :class="collapsed ? 'px-4 justify-center' : 'px-4'">
        <div class="w-8 h-8 rounded-lg bg-[#75fc96] flex items-center justify-center shrink-0 shadow-lg shadow-[#75fc96]/20">
          <span class="text-[#17191c] font-bold text-sm" style="font-family: 'Space Mono', monospace;">F</span>
        </div>
        <div v-if="!collapsed" class="min-w-0">
          <p class="font-semibold text-[13px] text-white/90 truncate leading-tight">{{ store.workspace?.name || 'FocusFlow' }}</p>
          <p class="text-[10px] text-white/40 truncate">{{ store.slug }}</p>
        </div>
      </div>

      <!-- Main nav -->
      <nav class="py-3 space-y-0.5" :class="collapsed ? 'px-2' : 'px-3'">
        <NuxtLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/[0.08] hover:text-white/90 transition-all duration-150"
          :class="collapsed ? 'px-0 py-2 justify-center' : 'px-2.5 py-2'"
          active-class="!bg-[#75fc96]/10 !text-[#75fc96] font-semibold"
        >
          <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
          <span v-if="!collapsed">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="mx-4 border-t border-white/[0.06]" />

      <!-- Projects section -->
      <div class="flex-1 overflow-y-auto py-3" :class="collapsed ? 'px-2' : 'px-3'">
        <div v-if="!collapsed" class="flex items-center justify-between px-2.5 pb-2">
          <span class="text-[10px] font-bold uppercase tracking-widest text-white/30">{{ t.projects }}</span>
          <button
            class="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-[#75fc96] hover:bg-white/[0.08] transition-all"
            @click="$emit('create-project')"
            :title="t.newProject"
          >
            <UIcon name="i-heroicons-plus" class="w-3 h-3" />
          </button>
        </div>

        <div class="space-y-0.5">
          <NuxtLink
            v-for="project in store.projects"
            :key="project.id"
            :to="`/${store.slug}/projects/${project.id}/kanban`"
            class="group flex items-center gap-2.5 rounded-lg text-[13px] text-white/50 hover:bg-white/[0.08] hover:text-white/90 transition-all duration-150"
            :class="[
              collapsed ? 'px-0 py-2 justify-center' : 'px-2.5 py-1.5',
              isActiveProject(project.id) ? '!bg-[#75fc96]/10 !text-[#75fc96] font-semibold' : '',
            ]"
          >
            <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: project.color }" />
            <span v-if="!collapsed" class="truncate">{{ project.name }}</span>
          </NuxtLink>

          <div v-if="store.projects.length === 0 && !collapsed" class="px-2.5 py-3">
            <p class="text-[11px] text-white/30">{{ t.noProjects }}</p>
          </div>
        </div>
      </div>

      <!-- Language + Notifications + user + collapse -->
      <div class="border-t border-white/[0.06]">
        <div v-if="!collapsed" class="px-3 pt-2 flex items-center justify-between">
          <NotificationBell />
          <div class="flex items-center gap-1">
            <ClientOnly><DarkModeToggle sidebar-style /></ClientOnly>
            <LanguageToggle />
          </div>
        </div>
        <div v-else class="flex flex-col items-center gap-2 pt-2">
          <NotificationBell />
          <ClientOnly><DarkModeToggle sidebar-style /></ClientOnly>
        </div>
        <div class="flex items-center gap-2 p-2" :class="collapsed ? 'justify-center' : ''">
          <NuxtLink
            :to="`/${store.slug}/settings`"
            class="flex items-center gap-2.5 flex-1 rounded-lg hover:bg-white/[0.08] transition-all duration-150"
            :class="collapsed ? 'p-1.5 justify-center' : 'px-2.5 py-2'"
          >
            <div class="w-7 h-7 rounded-full bg-[#75fc96]/15 text-[#75fc96] flex items-center justify-center text-[10px] font-bold shrink-0">
              {{ auth.userInitials }}
            </div>
            <div v-if="!collapsed" class="min-w-0">
              <p class="text-xs font-medium text-white/70 truncate">{{ auth.userEmail }}</p>
              <p v-if="auth.isSuperadmin" class="text-[9px] font-bold text-[#75fc96] uppercase tracking-wider">Superadmin</p>
              <p v-else-if="auth.isOwner" class="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Owner</p>
              <p v-else-if="auth.isAdmin" class="text-[9px] font-bold text-sky-400 uppercase tracking-wider">Admin</p>
            </div>
          </NuxtLink>
          <button
            v-if="!collapsed"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-colors shrink-0"
            @click="collapsed = true"
          >
            <UIcon name="i-heroicons-chevron-double-left-20-solid" class="w-3.5 h-3.5" />
          </button>
          <button
            v-if="collapsed"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-colors"
            @click="collapsed = false"
          >
            <UIcon name="i-heroicons-chevron-double-right-20-solid" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header class="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-focusflow-600 flex items-center justify-center">
          <span class="text-white font-bold text-xs" style="font-family: 'Space Mono', monospace;">F</span>
        </div>
        <span class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{{ store.workspace?.name || 'FocusFlow' }}</span>
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
      <div class="p-4 md:p-8 max-w-7xl">
        <slot />
      </div>
    </main>

    <!-- Floating Pomodoro Indicator -->
    <Transition name="slide-up">
      <div
        v-if="pomodoro.activeTask.value && pomodoro.running.value"
        class="fixed bottom-24 md:bottom-6 right-4 md:right-20 z-40 flex items-center gap-2 bg-white/80 dark:bg-[#1b1b1b]/80 backdrop-blur-xl border border-emerald-200 dark:border-[#75fc96]/20 rounded-full pl-3 pr-1.5 py-1.5 shadow-lg shadow-emerald-500/10"
      >
        <span class="text-sm">&#x23F1;</span>
        <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{{ pomodoro.activeTask.value.title }}</span>
        <span class="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{{ pomodoro.display.value }}</span>
        <button
          class="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-500 dark:text-[#99a0ae] hover:text-red-500 flex items-center justify-center transition-colors"
          @click="pomodoro.togglePomodoro()"
          :title="t.pause"
        >
          <UIcon name="i-heroicons-pause" class="w-3 h-3" />
        </button>
      </div>
    </Transition>

    <!-- Time Tracker Widget -->
    <TimeTracker v-if="store.workspace?.id" :workspace-id="store.workspace.id" />

    <!-- Lofi Player -->
    <LofiPlayer />

    <!-- Mobile Bottom Nav -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10">
      <div class="flex items-stretch justify-around h-14 px-1">
        <NuxtLink
          v-for="item in mobileNav"
          :key="item.to"
          :to="item.to"
          :prefetch="false"
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
const pomodoro = usePomodoroTimer()
const { labels: tRef } = useLanguage()
const t = tRef
const { canUseAI, canManageMembers, canManageWorkspace, canViewUsageStats, canViewTimesheets, canViewGoals, canViewRoadmap, canViewAgenda } = usePermissions()

const collapsed = ref(false)

const workspaceSlug = computed(() => (route.params.workspace as string) || store.slug || '')

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

const allNav = computed(() => [
  { label: t.value.dashboard, icon: 'i-heroicons-squares-2x2', to: `/${workspaceSlug.value}/dashboard`, show: true },
  { label: t.value.projects, icon: 'i-heroicons-folder-open', to: `/${workspaceSlug.value}/projects`, show: true },
  { label: t.value.aiAgents, icon: 'i-heroicons-cpu-chip', to: `/${workspaceSlug.value}/agents`, show: canUseAI.value },
  { label: t.value.timesheet, icon: 'i-heroicons-clock', to: `/${workspaceSlug.value}/timesheet`, show: canViewTimesheets.value },
  { label: t.value.files, icon: 'i-heroicons-document-duplicate', to: `/${workspaceSlug.value}/files`, show: true },
  { label: t.value.goals, icon: 'i-heroicons-flag', to: `/${workspaceSlug.value}/goals`, show: canViewGoals.value },
  { label: t.value.roadmap, icon: 'i-heroicons-map', to: `/${workspaceSlug.value}/roadmap`, show: canViewRoadmap.value },
  { label: t.value.agenda, icon: 'i-heroicons-calendar-days', to: `/${workspaceSlug.value}/agenda`, show: canViewAgenda.value },
  { label: t.value.team, icon: 'i-heroicons-user-group', to: `/${workspaceSlug.value}/team`, show: canManageMembers.value },
  { label: t.value.roles, icon: 'i-heroicons-shield-check', to: `/${workspaceSlug.value}/roles`, show: canManageMembers.value },
  { label: t.value.billing, icon: 'i-heroicons-credit-card', to: `/${workspaceSlug.value}/billing`, show: canManageWorkspace.value },
  { label: t.value.settings, icon: 'i-heroicons-cog-6-tooth', to: `/${workspaceSlug.value}/settings`, show: true },
])

const mainNav = computed(() => allNav.value.filter(i => i.show))

const mobileNav = computed(() => allNav.value
  .filter(i => i.show && i.label !== t.value.team)
  .map(i => i.label === t.value.dashboard ? { ...i, label: t.value.home } : i)
)

function isActiveProject(projectId: string) {
  return route.params.id === projectId
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
