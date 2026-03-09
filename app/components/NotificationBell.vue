<template>
  <div ref="bellRef" class="relative">
    <button
      @click="open = !open"
      class="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:text-white/40 md:hover:text-white/80 md:hover:bg-white/[0.08] dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
    >
      <UIcon name="i-heroicons-bell" class="w-[18px] h-[18px]" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ring-white md:ring-[#0d0d0d]"
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
          class="fixed w-80 max-h-[400px] bg-white dark:bg-[#1b1b1b] border border-gray-200/80 dark:border-white/10 rounded-xl shadow-xl z-[100] flex flex-col overflow-hidden"
          :style="panelStyle"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-white/10">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ t.notifications }}</h3>
            <div class="flex items-center gap-2">
              <button
                v-if="unreadCount > 0"
                @click="markAllRead"
                class="text-[10px] font-semibold text-focusflow-600 hover:text-focusflow-700 cursor-pointer"
              >
                {{ t.markAllRead }}
              </button>
              <button
                @click="open = false"
                class="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-bell-slash" class="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p class="text-xs">{{ t.noNotifications }}</p>
            </div>
            <div
              v-for="notif in notifications"
              :key="notif.id"
              class="px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              :class="!notif.read ? 'bg-focusflow-50/30 dark:bg-focusflow-500/5' : ''"
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
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100 leading-snug">{{ notif.title }}</p>
                  <p v-if="notif.body" class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ notif.body }}</p>
                  <!-- RSVP buttons for meeting invitations -->
                  <div
                    v-if="notif.type === 'meeting_scheduled' && notif.entity_id && !rsvpStatus[notif.entity_id]"
                    class="flex gap-2 mt-1.5"
                    @click.stop
                  >
                    <button
                      class="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/25 transition-colors cursor-pointer"
                      :disabled="rsvpLoading[notif.entity_id]"
                      @click="respondRsvp(notif, 'accepted')"
                    >
                      {{ lang.current.value === 'es' ? 'Aceptar' : 'Accept' }}
                    </button>
                    <button
                      class="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/25 transition-colors cursor-pointer"
                      :disabled="rsvpLoading[notif.entity_id]"
                      @click="respondRsvp(notif, 'declined')"
                    >
                      {{ lang.current.value === 'es' ? 'Rechazar' : 'Decline' }}
                    </button>
                  </div>
                  <p
                    v-else-if="notif.type === 'meeting_scheduled' && notif.entity_id && rsvpStatus[notif.entity_id]"
                    class="text-[10px] font-semibold mt-1.5"
                    :class="rsvpStatus[notif.entity_id] === 'accepted' ? 'text-green-600' : 'text-red-500'"
                  >
                    {{ rsvpStatus[notif.entity_id] === 'accepted'
                      ? (lang.current.value === 'es' ? 'Aceptada' : 'Accepted')
                      : (lang.current.value === 'es' ? 'Rechazada' : 'Declined') }}
                  </p>
                  <p class="text-[9px] text-gray-400 dark:text-gray-500 mt-1">{{ timeAgo(notif.created_at) }}</p>
                </div>
                <div v-if="!notif.read" class="w-2 h-2 rounded-full bg-focusflow-500 shrink-0 mt-1.5" />
              </div>
            </div>
          </div>

          <!-- Push notification toggle -->
          <div class="px-4 py-2.5 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03]">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span class="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  {{ lang.current.value === 'es' ? 'Notificaciones push' : 'Push notifications' }}
                </span>
              </div>
              <button
                v-if="pushNotif.permission.value === 'granted'"
                class="text-[10px] font-semibold text-green-600 flex items-center gap-1 cursor-default"
              >
                <UIcon name="i-heroicons-check-circle-solid" class="w-3.5 h-3.5" />
                {{ lang.current.value === 'es' ? 'Activas' : 'Active' }}
              </button>
              <button
                v-else-if="pushNotif.permission.value === 'denied'"
                class="text-[10px] font-semibold text-red-500 cursor-default"
              >
                {{ lang.current.value === 'es' ? 'Bloqueadas' : 'Blocked' }}
              </button>
              <button
                v-else
                @click="pushNotif.requestPermission()"
                class="text-[10px] font-semibold text-focusflow-600 hover:text-focusflow-700 cursor-pointer"
              >
                {{ lang.current.value === 'es' ? 'Activar' : 'Enable' }}
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Backdrop to close -->
      <div v-if="open" class="fixed inset-0 z-[99]" @click="open = false" />
    </Teleport>
  </div>
</template>

<script lang="ts">
// Module-level shared state — all NotificationBell instances share one poll
import type { Notification } from '~/types'

const _sharedNotifications = ref<Notification[]>([])
let _sharedPollInterval: ReturnType<typeof setInterval> | null = null
let _sharedWorkspaceId = ''
let _instanceCount = 0

async function _sharedLoad(wsId: string) {
  if (!wsId) return
  try {
    _sharedNotifications.value = await $fetch<Notification[]>(`/api/workspaces/${wsId}/notifications`)
  } catch {}
}

function _startSharedPoll(wsId: string) {
  if (_sharedPollInterval && _sharedWorkspaceId === wsId) return // already polling this workspace
  if (_sharedPollInterval) clearInterval(_sharedPollInterval)
  _sharedWorkspaceId = wsId
  _sharedLoad(wsId)
  _sharedPollInterval = setInterval(() => _sharedLoad(wsId), 60_000)
}

function _stopSharedPoll() {
  if (_sharedPollInterval) {
    clearInterval(_sharedPollInterval)
    _sharedPollInterval = null
  }
}
</script>

<script setup lang="ts">
const store = useWorkspaceStore()
const pushNotif = usePushNotifications()
const lang = useLanguage()
const t = lang.labels

const open = ref(false)
const bellRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const notifications = _sharedNotifications

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
  _sharedLoad(workspaceId.value)
})

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

const rsvpStatus = ref<Record<string, 'accepted' | 'declined'>>({})
const rsvpLoading = ref<Record<string, boolean>>({})

async function respondRsvp(notif: Notification, status: 'accepted' | 'declined') {
  if (!notif.entity_id || !workspaceId.value) return
  rsvpLoading.value[notif.entity_id] = true
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/meetings/${notif.entity_id}/rsvp`, {
      method: 'POST',
      body: { status },
    })
    rsvpStatus.value[notif.entity_id] = status
    // Mark notification as read
    markRead(notif)
  } catch (err) {
    console.error('[NotificationBell] RSVP failed:', err)
  } finally {
    rsvpLoading.value[notif.entity_id] = false
  }
}

function notifIcon(type: string) {
  if (type === 'deadline_urgent') return 'i-heroicons-exclamation-triangle'
  if (type === 'deadline_approaching') return 'i-heroicons-clock'
  if (type === 'task_assigned') return 'i-heroicons-clipboard-document-check'
  if (type === 'workspace_invitation') return 'i-heroicons-user-plus'
  if (type === 'meeting_scheduled' || type === 'meeting_rsvp' || type === 'meeting_reminder') return 'i-heroicons-video-camera'
  return 'i-heroicons-bell'
}

function notifIconBg(type: string) {
  if (type === 'deadline_urgent') return 'bg-red-50 dark:bg-red-500/10'
  if (type === 'deadline_approaching') return 'bg-amber-50 dark:bg-amber-500/10'
  if (type === 'task_assigned') return 'bg-blue-50 dark:bg-blue-500/10'
  if (type === 'workspace_invitation') return 'bg-green-50 dark:bg-green-500/10'
  if (type === 'meeting_scheduled' || type === 'meeting_rsvp' || type === 'meeting_reminder') return 'bg-purple-50 dark:bg-purple-500/10'
  return 'bg-gray-50 dark:bg-white/[0.06]'
}

function notifIconColor(type: string) {
  if (type === 'deadline_urgent') return 'text-red-500'
  if (type === 'deadline_approaching') return 'text-amber-500'
  if (type === 'task_assigned') return 'text-blue-500'
  if (type === 'workspace_invitation') return 'text-green-500'
  if (type === 'meeting_scheduled' || type === 'meeting_rsvp' || type === 'meeting_reminder') return 'text-purple-500'
  return 'text-gray-500 dark:text-gray-400'
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

// Shared poll — only one interval regardless of how many instances
onMounted(() => {
  _instanceCount++
  if (workspaceId.value) _startSharedPoll(workspaceId.value)
})

watch(workspaceId, (id) => {
  if (id) _startSharedPoll(id)
}, { immediate: false })

onUnmounted(() => {
  _instanceCount--
  if (_instanceCount <= 0) {
    _stopSharedPoll()
    _instanceCount = 0
  }
})
</script>
