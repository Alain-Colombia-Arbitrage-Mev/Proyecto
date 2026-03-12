<template>
  <div class="min-h-screen bg-[#f8f9fb] dark:bg-[#111] transition-colors">
    <!-- Desktop Sidebar -->
    <aside
      class="dark hidden md:flex fixed inset-y-0 left-0 z-30 flex-col bg-[#0d0d0d] border-r border-white/10 transition-all duration-300 ease-out"
      style="color-scheme: dark"
      :class="collapsed ? 'w-[68px]' : 'w-[252px]'"
    >
      <!-- Logo + workspace switcher -->
      <div class="h-14 flex items-center gap-2.5 shrink-0 border-b border-white/[0.06] relative" :class="collapsed ? 'px-4 justify-center' : 'px-4'">
        <img src="/logo.png" alt="FocusFlow" class="w-8 h-8 rounded-lg shrink-0 shadow-lg shadow-[#75fc96]/20" />
        <button
          v-if="!collapsed"
          class="min-w-0 flex-1 text-left cursor-pointer hover:bg-white/[0.06] rounded-lg px-1.5 py-1 -mx-1.5 transition-colors group"
          @click="toggleWsSwitcher"
        >
          <div class="flex items-center gap-1">
            <p class="font-semibold text-[13px] text-white/90 truncate leading-tight flex-1">{{ store.workspace?.name || 'FocusFlow' }}</p>
            <UIcon name="i-heroicons-chevron-up-down" class="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 shrink-0 transition-colors" />
          </div>
          <p class="text-[10px] text-white/40 truncate">{{ store.slug }}</p>
        </button>

        <!-- Workspace switcher dropdown -->
        <Teleport to="body">
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="showWsSwitcher"
              class="dark fixed z-[200] w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
              :style="wsSwitcherStyle"
            >
              <div class="px-3 py-2 border-b border-white/[0.06]">
                <p class="text-[10px] font-bold uppercase tracking-wider text-white/30">Workspaces</p>
              </div>
              <div class="max-h-[280px] overflow-y-auto py-1">
                <button
                  v-for="ws in userWorkspaces" :key="ws.id"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
                  :class="ws.id === store.workspace?.id ? 'bg-[#75fc96]/10' : ''"
                  @click="switchWorkspace(ws)"
                >
                  <div
                    class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                    :class="ws.id === store.workspace?.id ? 'bg-[#75fc96]/20 text-[#75fc96]' : 'bg-white/[0.06] text-white/50'"
                  >
                    {{ ws.name?.charAt(0)?.toUpperCase() || 'W' }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[12px] font-medium truncate" :class="ws.id === store.workspace?.id ? 'text-[#75fc96]' : 'text-white/80'">{{ ws.name }}</p>
                    <p class="text-[10px] truncate" :class="ws.id === store.workspace?.id ? 'text-[#75fc96]/60' : 'text-white/30'">{{ ws.slug }}</p>
                  </div>
                  <UIcon v-if="ws.id === store.workspace?.id" name="i-heroicons-check" class="w-4 h-4 text-[#75fc96] shrink-0" />
                </button>
              </div>
            </div>
          </Transition>
          <div v-if="showWsSwitcher" class="fixed inset-0 z-[199]" @click="showWsSwitcher = false" />
        </Teleport>
      </div>

      <!-- Main nav -->
      <nav class="py-3 space-y-0.5" :class="collapsed ? 'px-2' : 'px-3'">
        <template v-for="item in mainNav" :key="item.to">
          <!-- Item with children (collapsible group) -->
          <div v-if="item.children && item.children.length > 0 && !collapsed">
            <button
              class="w-full group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 px-2.5 py-2 cursor-pointer"
              :class="isGroupActive(item) ? '!bg-[#75fc96]/10 !text-[#75fc96] font-semibold' : 'text-white/50 hover:bg-white/[0.08] hover:text-white/90'"
              @click="toggleGroup(item.id!)"
            >
              <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <UIcon
                name="i-heroicons-chevron-right-20-solid"
                class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                :class="isGroupExpanded(item.id!) ? 'rotate-90' : ''"
              />
            </button>
            <Transition name="submenu">
              <div v-if="isGroupExpanded(item.id!)" class="ml-[26px] mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-2">
                <NuxtLink
                  v-for="child in item.children.filter(c => c.show)"
                  :key="child.to + child.label"
                  :to="child.to"
                  class="group flex items-center gap-2.5 rounded-lg text-[12px] font-medium text-white/40 hover:bg-white/[0.06] hover:text-white/80 transition-all duration-150 px-2 py-1.5"
                  active-class="!text-[#75fc96] !bg-[#75fc96]/10 font-semibold"
                >
                  <div class="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-white/[0.1] transition-colors">
                    <UIcon :name="child.icon" class="w-3.5 h-3.5" />
                  </div>
                  <span>{{ child.label }}</span>
                </NuxtLink>
              </div>
            </Transition>
          </div>

          <!-- Collapsed sidebar with children: just icon -->
          <NuxtLink
            v-else-if="item.children && item.children.length > 0 && collapsed"
            :to="item.to"
            class="group flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/[0.08] hover:text-white/90 transition-all duration-150 px-0 py-2 justify-center"
            active-class="!bg-[#75fc96]/10 !text-[#75fc96] font-semibold"
          >
            <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
          </NuxtLink>

          <!-- Regular nav item -->
          <NuxtLink
            v-else
            :to="item.to"
            class="group flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/[0.08] hover:text-white/90 transition-all duration-150"
            :class="collapsed ? 'px-0 py-2 justify-center' : 'px-2.5 py-2'"
            active-class="!bg-[#75fc96]/10 !text-[#75fc96] font-semibold"
          >
            <UIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Lofi Player (sidebar mini) -->
      <div class="shrink-0">
        <LazyLofiPlayer sidebar :collapsed="collapsed" />
      </div>

      <!-- Language + Notifications + user + collapse -->
      <div class="border-t border-white/[0.06]">
        <div v-if="!collapsed" class="px-3 pt-2 flex items-center justify-between">
          <LazyNotificationBell />
          <div class="flex items-center gap-1">
            <ClientOnly><DarkModeToggle sidebar-style /></ClientOnly>
            <LanguageToggle />
          </div>
        </div>
        <div v-else class="flex flex-col items-center gap-2 pt-2">
          <LazyNotificationBell />
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
            class="w-8 h-8 flex items-center justify-center rounded-md bg-black text-white/50 hover:text-white hover:bg-black/80 transition-all shrink-0 border border-white/[0.08] shadow-sm"
            @click="collapsed = true"
          >
            <UIcon name="i-heroicons-chevron-double-left-20-solid" class="w-4 h-4" />
          </button>
          <button
            v-if="collapsed"
            class="w-8 h-8 flex items-center justify-center rounded-md bg-black text-white/50 hover:text-white hover:bg-black/80 transition-all border border-white/[0.08] shadow-sm"
            @click="collapsed = false"
          >
            <UIcon name="i-heroicons-chevron-double-right-20-solid" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header class="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10">
      <button class="flex items-center gap-2.5 cursor-pointer" @click="toggleMobileWsSwitcher">
        <img src="/logo.png" alt="FocusFlow" class="w-8 h-8 rounded-lg shadow-sm shadow-[#75fc96]/20" />
        <div class="min-w-0">
          <p class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">{{ store.workspace?.name || 'FocusFlow' }}</p>
        </div>
        <UIcon name="i-heroicons-chevron-up-down" class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
      </button>
      <div class="flex items-center gap-1.5">
        <ClientOnly><DarkModeToggle /></ClientOnly>
        <LazyNotificationBell />
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="transition-all duration-300 ease-out"
      :class="[
        'md:pt-0 pt-14 pb-24 md:pb-0',
        collapsed ? 'md:pl-[68px]' : 'md:pl-[252px]',
      ]"
    >
      <div class="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <slot />
      </div>
    </main>

    <!-- Workspace Invitation Banner -->
    <InvitationBanner />

    <!-- Floating Pomodoro Indicator -->
    <Transition name="slide-up">
      <div
        v-if="pomodoro.activeTask.value && pomodoro.running.value"
        class="fixed bottom-[6.5rem] md:bottom-6 right-4 md:right-20 z-40 flex items-center gap-2 bg-white/80 dark:bg-[#1b1b1b]/80 backdrop-blur-xl border border-emerald-200 dark:border-[#75fc96]/20 rounded-full pl-3 pr-1.5 py-1.5 shadow-lg shadow-emerald-500/10"
      >
        <span class="text-sm">&#x23F1;</span>
        <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{{ pomodoro.activeTask.value.title }}</span>
        <span class="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{{ pomodoro.display.value }}</span>
        <button
          class="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-500 dark:text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
          @click="pomodoro.togglePomodoro()"
          :title="t.pause"
        >
          <UIcon name="i-heroicons-pause" class="w-3 h-3" />
        </button>
      </div>
    </Transition>

    <!-- Time Tracker Widget -->
    <LazyTimeTracker v-if="store.workspace?.id" :workspace-id="store.workspace.id" />

    <!-- Lofi Player (mobile only — desktop is in sidebar) -->
    <div class="md:hidden">
      <LazyLofiPlayer />
    </div>

    <!-- Mobile Workspace Switcher -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showMobileWsSwitcher"
          class="fixed z-[200] left-3 right-3 top-[60px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden"
        >
          <div class="px-3 py-2 border-b border-gray-100 dark:border-white/[0.06]">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Workspaces</p>
          </div>
          <div class="max-h-[300px] overflow-y-auto py-1">
            <button
              v-for="ws in userWorkspaces" :key="ws.id"
              class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              :class="ws.id === store.workspace?.id ? 'bg-focusflow-50 dark:bg-[#75fc96]/10' : ''"
              @click="switchWorkspace(ws); showMobileWsSwitcher = false"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                :class="ws.id === store.workspace?.id ? 'bg-focusflow-100 dark:bg-[#75fc96]/20 text-focusflow-700 dark:text-[#75fc96]' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/50'"
              >
                {{ ws.name?.charAt(0)?.toUpperCase() || 'W' }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate" :class="ws.id === store.workspace?.id ? 'text-focusflow-700 dark:text-[#75fc96]' : 'text-gray-900 dark:text-white/80'">{{ ws.name }}</p>
                <p class="text-[10px] truncate text-gray-400 dark:text-white/30">{{ ws.slug }}</p>
              </div>
              <UIcon v-if="ws.id === store.workspace?.id" name="i-heroicons-check" class="w-4 h-4 text-focusflow-600 dark:text-[#75fc96] shrink-0" />
            </button>
          </div>
        </div>
      </Transition>
      <div v-if="showMobileWsSwitcher" class="fixed inset-0 z-[199]" @click="showMobileWsSwitcher = false" />
    </Teleport>

    <!-- Mobile Bottom Nav -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10">
      <div class="flex items-stretch justify-around h-16 px-2">
        <NuxtLink
          v-for="item in mobileNavPrimary"
          :key="item.to"
          :to="item.to"
          :prefetch="false"
          class="flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 text-gray-400 dark:text-gray-500 transition-colors"
          active-class="!text-focusflow-600 dark:!text-[#75fc96]"
        >
          <UIcon :name="item.icon" class="w-6 h-6" />
          <span class="text-[10px] font-semibold truncate">{{ item.label }}</span>
        </NuxtLink>
        <!-- More button -->
        <button
          class="flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 transition-colors cursor-pointer"
          :class="showMobileMore ? 'text-focusflow-600 dark:text-[#75fc96]' : 'text-gray-400 dark:text-gray-500'"
          @click="showMobileMore = !showMobileMore"
        >
          <UIcon name="i-heroicons-ellipsis-horizontal-circle" class="w-6 h-6" />
          <span class="text-[10px] font-semibold">{{ t.more || 'Mas' }}</span>
        </button>
      </div>
      <div class="h-[env(safe-area-inset-bottom)]" />
    </nav>

    <!-- Mobile More Menu -->
    <Transition name="slide-up">
      <div
        v-if="showMobileMore"
        class="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
      >
        <div class="grid grid-cols-4 gap-1 p-3">
          <NuxtLink
            v-for="item in mobileNavSecondary"
            :key="item.to"
            :to="item.to"
            :prefetch="false"
            class="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            active-class="!text-focusflow-600 dark:!text-[#75fc96] !bg-focusflow-50 dark:!bg-[#75fc96]/10"
            @click="showMobileMore = false"
          >
            <UIcon :name="item.icon" class="w-6 h-6" />
            <span class="text-[10px] font-medium text-center leading-tight">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <!-- Mobile More Backdrop -->
    <Transition name="fade">
      <div
        v-if="showMobileMore"
        class="md:hidden fixed inset-0 z-35 bg-black/20 dark:bg-black/40"
        @click="showMobileMore = false"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const store = useWorkspaceStore()
const auth = useAuthStore()
const pomodoro = usePomodoroTimer()
const lang = useLanguage()
const t = lang.labels
const { canUseAI, canManageMembers, canManageWorkspace, canViewUsageStats, canViewTimesheets, canViewGoals, canViewRoadmap, canViewAgenda, canUseWorkflows } = usePermissions()
const { isEnabled: moduleEnabled } = useModules()

const collapsed = ref(false)
const showMobileMore = ref(false)
const expandedGroups = ref<Set<string>>(new Set())
const router = useRouter()

// ── Workspace Switcher ──
const showWsSwitcher = ref(false)
const userWorkspaces = ref<any[]>([])

const wsSwitcherStyle = computed(() => ({
  left: '12px',
  top: '58px',
}))

async function loadUserWorkspaces() {
  try {
    userWorkspaces.value = await $fetch<any[]>('/api/user/workspaces')
  } catch {}
}

function toggleWsSwitcher() {
  if (!showWsSwitcher.value) {
    loadUserWorkspaces()
  }
  showWsSwitcher.value = !showWsSwitcher.value
}

const showMobileWsSwitcher = ref(false)

function toggleMobileWsSwitcher() {
  if (!showMobileWsSwitcher.value) loadUserWorkspaces()
  showMobileWsSwitcher.value = !showMobileWsSwitcher.value
}

async function switchWorkspace(ws: any) {
  showWsSwitcher.value = false
  showMobileWsSwitcher.value = false
  if (ws.slug === store.slug) return
  await router.push(`/${ws.slug}/dashboard`)
}

const workspaceSlug = computed(() => (route.params.workspace as string) || store.slug || '')

watch(workspaceSlug, async (slug, oldSlug) => {
  if (slug) {
    // Force reload when navigating back (e.g. after login) to get fresh ai_config
    const force = !oldSlug
    await store.loadWorkspace(slug, force)
    // Load user's role for this workspace
    if (store.workspace?.id) {
      await auth.loadRole(store.workspace.id)
    }
  }
}, { immediate: true })

watch(() => route.params.id as string, (id) => {
  store.setCurrentProject(id || null)
}, { immediate: true })

interface NavItem {
  label: string
  icon: string
  to: string
  show: boolean
  id?: string
  children?: NavItem[]
}

const allNav = computed<NavItem[]>(() => [
  { label: t.value.dashboard, icon: 'i-heroicons-squares-2x2', to: `/${workspaceSlug.value}/dashboard`, show: true },
  { label: t.value.projects, icon: 'i-heroicons-folder-open', to: `/${workspaceSlug.value}/projects`, show: true },
  { label: t.value.aiAgents, icon: 'i-heroicons-cpu-chip', to: `/${workspaceSlug.value}/agents`, show: canUseAI.value && moduleEnabled('ai_agents') },
  { label: t.value.workflows, icon: 'i-heroicons-bolt', to: `/${workspaceSlug.value}/workflows`, show: canUseWorkflows.value && moduleEnabled('workflows') },
  { label: t.value.timesheet, icon: 'i-heroicons-clock', to: `/${workspaceSlug.value}/timesheet`, show: canViewTimesheets.value && moduleEnabled('timesheet') },
  { label: t.value.files, icon: 'i-heroicons-document-duplicate', to: `/${workspaceSlug.value}/files`, show: moduleEnabled('files') },
  { label: lang.language.value === 'en' ? 'Orchestrator' : 'Orquestador', icon: 'i-heroicons-sparkles', to: `/${workspaceSlug.value}/orchestrator`, show: canUseAI.value && moduleEnabled('orchestrator') },
  { label: t.value.goals, icon: 'i-heroicons-flag', to: `/${workspaceSlug.value}/goals`, show: canViewGoals.value && moduleEnabled('goals') },
  { label: t.value.roadmap, icon: 'i-heroicons-map', to: `/${workspaceSlug.value}/roadmap`, show: canViewRoadmap.value && moduleEnabled('roadmap') },
  {
    label: t.value.team, icon: 'i-heroicons-user-group', to: `/${workspaceSlug.value}/team`, show: canManageMembers.value, id: 'team',
    children: [
      { label: t.value.inviteMember, icon: 'i-heroicons-user-plus', to: `/${workspaceSlug.value}/team`, show: true },
      { label: t.value.roles, icon: 'i-heroicons-shield-check', to: `/${workspaceSlug.value}/roles`, show: true },
    ],
  },
  {
    label: t.value.agenda, icon: 'i-heroicons-calendar-days', to: `/${workspaceSlug.value}/agenda`, show: canViewAgenda.value && moduleEnabled('agenda'), id: 'agenda',
    children: [
      { label: t.value.scheduleMeeting, icon: 'i-heroicons-video-camera', to: `/${workspaceSlug.value}/agenda`, show: true },
      { label: t.value.reserveTime, icon: 'i-heroicons-clock', to: `/${workspaceSlug.value}/agenda`, show: true },
    ],
  },
  { label: t.value.adminUsers, icon: 'i-heroicons-shield-exclamation', to: `/${workspaceSlug.value}/admin/users`, show: auth.isSuperadmin },
  { label: t.value.billing, icon: 'i-heroicons-credit-card', to: `/${workspaceSlug.value}/billing`, show: canManageWorkspace.value && moduleEnabled('billing') },
  { label: t.value.settings, icon: 'i-heroicons-cog-6-tooth', to: `/${workspaceSlug.value}/settings`, show: true, id: 'settings',
    children: [
      { label: lang.language.value === 'en' ? 'General' : 'General', icon: 'i-heroicons-cog-6-tooth', to: `/${workspaceSlug.value}/settings`, show: true },
      { label: 'Workspaces', icon: 'i-heroicons-building-office-2', to: `/${workspaceSlug.value}/workspaces`, show: true },
      { label: lang.language.value === 'en' ? 'Modules' : 'Modulos', icon: 'i-heroicons-square-3-stack-3d', to: `/${workspaceSlug.value}/modules`, show: canManageWorkspace.value },
      { label: 'MCP/API', icon: 'i-heroicons-puzzle-piece', to: `/${workspaceSlug.value}/integrations`, show: moduleEnabled('integrations') },
    ],
  },
])

const mainNav = computed(() => allNav.value.filter(i => i.show))

function toggleGroup(id: string) {
  if (expandedGroups.value.has(id)) expandedGroups.value.delete(id)
  else expandedGroups.value.add(id)
}

function isGroupExpanded(id: string) {
  return expandedGroups.value.has(id)
}

// Check if any child route is active
function isGroupActive(item: NavItem) {
  if (!item.children) return false
  const paths = [item.to, ...item.children.map(c => c.to)]
  return paths.some(p => route.path.startsWith(p))
}

// Auto-expand group if a child is active
watch(() => route.path, () => {
  for (const item of mainNav.value) {
    if (item.id && item.children && isGroupActive(item)) {
      expandedGroups.value.add(item.id)
    }
  }
}, { immediate: true })

// Mobile nav: 4 primary items + "More" button for the rest
const primaryPaths = computed(() => new Set([
  `/${workspaceSlug.value}/dashboard`,
  `/${workspaceSlug.value}/projects`,
  `/${workspaceSlug.value}/agenda`,
  `/${workspaceSlug.value}/files`,
]))

// Flatten nav for mobile (expand children into top-level items)
const mobileNavAll = computed(() => {
  const flat: NavItem[] = []
  for (const item of allNav.value) {
    if (!item.show) continue
    flat.push({ ...item, label: item.label === t.value.dashboard ? t.value.home : item.label })
    if (item.children) {
      for (const child of item.children) {
        if (child.show) flat.push(child)
      }
    }
  }
  return flat
})

const mobileNavPrimary = computed(() =>
  mobileNavAll.value.filter(i => primaryPaths.value.has(i.to)).slice(0, 4)
)

const mobileNavSecondary = computed(() =>
  mobileNavAll.value.filter(i => !primaryPaths.value.has(i.to))
)

// Close mobile more menu on route change
watch(() => route.fullPath, () => { showMobileMore.value = false })

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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}
.submenu-enter-to {
  max-height: 200px;
}
</style>
