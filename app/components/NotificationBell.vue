<template>
  <div ref="bellRef" class="relative">
    <button
      @click="open = !open"
      class="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] md:text-white/40 md:hover:text-white/80 transition-colors cursor-pointer"
    >
      <UIcon name="i-heroicons-bell" class="w-[18px] h-[18px]" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ring-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown panel — fixed to viewport so it never overflows -->
    <Teleport to="body">
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="open"
          ref="panelRef"
          class="fixed w-80 max-h-[400px] bg-white border border-gray-100 rounded-xl shadow-xl z-[100] flex flex-col overflow-hidden"
          :style="panelStyle"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 class="text-sm font-bold text-gray-900">{{ t.notifications }}</h3>
            <button
              v-if="unreadCount > 0"
              @click="markAllRead"
              class="text-[10px] font-semibold text-focusflow-600 hover:text-focusflow-700 cursor-pointer"
            >
              {{ t.markAllRead }}
            </button>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-400">
              <UIcon name="i-heroicons-bell-slash" class="w-8 h-8 text-gray-300 mb-2" />
              <p class="text-xs">{{ t.noNotifications }}</p>
            </div>
            <div
              v-for="notif in notifications"
              :key="notif.id"
              class="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
              :class="!notif.read ? 'bg-focusflow-50/30' : ''"
              @click="markRead(notif)"
            >
              <div class="flex items-start gap-2.5">
                <div
                  class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  :class="notifIconBg(notif.type)"
                >
                  <UIcon :name="notifIcon(notif.type)" class="w-3.5 h-3.5" :class="notifIconColor(notif.type)" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-gray-900 leading-snug">{{ notif.title }}</p>
                  <p v-if="notif.body" class="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{{ notif.body }}</p>
                  <p class="text-[9px] text-gray-400 mt-1">{{ timeAgo(notif.created_at) }}</p>
                </div>
                <div v-if="!notif.read" class="w-2 h-2 rounded-full bg-focusflow-500 shrink-0 mt-1.5" />
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Backdrop to close -->
      <div v-if="open" class="fixed inset-0 z-[99]" @click="open = false" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types'

const store = useWorkspaceStore()
const pushNotif = usePushNotifications()
const lang = useLanguage()
const t = lang.labels

const open = ref(false)
const bellRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const notifications = ref<Notification[]>([])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const workspaceId = computed(() => store.workspace?.id || '')

// Position panel relative to bell button
const panelStyle = computed(() => {
  if (!import.meta.client || !bellRef.value) return { left: '16px', bottom: '60px' }
  const rect = bellRef.value.getBoundingClientRect()
  const isMobile = window.innerWidth < 768

  if (isMobile) {
    // On mobile: show below the top header
    return { left: '12px', right: '12px', top: `${rect.bottom + 8}px`, width: 'auto' }
  }

  // On desktop: position to the right of the bell, above bottom
  return {
    left: `${rect.right + 8}px`,
    bottom: `${window.innerHeight - rect.bottom}px`,
  }
})

// Listen for foreground FCM messages
pushNotif.listenForeground(() => {
  loadNotifications()
})

async function loadNotifications() {
  if (!workspaceId.value) return
  try {
    const data = await $fetch<Notification[]>(`/api/workspaces/${workspaceId.value}/notifications`)
    notifications.value = data
  } catch {}
}

async function markAllRead() {
  if (!workspaceId.value) return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/notifications`, {
      method: 'PATCH',
      body: { markAllRead: true },
    })
    notifications.value = notifications.value.map(n => ({ ...n, read: true }))
  } catch {}
}

async function markRead(notif: Notification) {
  if (notif.read) return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/notifications`, {
      method: 'PATCH',
      body: { id: notif.id },
    })
    const idx = notifications.value.findIndex(n => n.id === notif.id)
    if (idx !== -1) notifications.value[idx] = { ...notifications.value[idx]!, read: true }
  } catch {}
}

function notifIcon(type: string) {
  if (type === 'deadline_urgent') return 'i-heroicons-exclamation-triangle'
  if (type === 'deadline_approaching') return 'i-heroicons-clock'
  if (type === 'task_assigned') return 'i-heroicons-clipboard-document-check'
  if (type === 'workspace_invitation') return 'i-heroicons-user-plus'
  return 'i-heroicons-bell'
}

function notifIconBg(type: string) {
  if (type === 'deadline_urgent') return 'bg-red-50'
  if (type === 'deadline_approaching') return 'bg-amber-50'
  if (type === 'task_assigned') return 'bg-blue-50'
  if (type === 'workspace_invitation') return 'bg-green-50'
  return 'bg-gray-50'
}

function notifIconColor(type: string) {
  if (type === 'deadline_urgent') return 'text-red-500'
  if (type === 'deadline_approaching') return 'text-amber-500'
  if (type === 'task_assigned') return 'text-blue-500'
  if (type === 'workspace_invitation') return 'text-green-500'
  return 'text-gray-400'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t.value.now
  if (mins < 60) return `${mins}${t.value.minutesAgo}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}${t.value.hoursAgo}`
  const days = Math.floor(hours / 24)
  return `${days}${t.value.daysAgo}`
}

// Poll every 60s
let pollInterval: ReturnType<typeof setInterval> | null = null

watch(workspaceId, (id) => {
  if (id) {
    loadNotifications()
    if (pollInterval) clearInterval(pollInterval)
    pollInterval = setInterval(loadNotifications, 60_000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>
