<template>
  <div class="space-y-5">

    <!-- ═══════ HEADER BAR ═══════ -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-focusflow-500 to-teal-500 flex items-center justify-center shadow-lg shadow-focusflow-500/20">
          <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1px;">{{ t.teamAgenda }}</h1>
          <p class="text-xs text-gray-400 dark:text-[#6b7280] mt-0.5">{{ members.length }} {{ lang.language.value === 'en' ? 'team members' : 'miembros del equipo' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Week nav -->
        <div class="flex items-center bg-gray-100 dark:bg-white/[0.06] rounded-lg p-0.5">
          <button class="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all" @click="changeWeek(-1)">
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
          </button>
          <button class="px-3 h-7 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 rounded-md transition-all" @click="goToday">
            {{ t.today }}
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all" @click="changeWeek(1)">
            <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:inline tabular-nums">{{ weekLabel }}</span>
        <div class="w-px h-5 bg-gray-200 dark:bg-white/10 hidden sm:block" />
        <UButton v-if="canManageReservedDates" icon="i-heroicons-calendar" variant="soft" size="sm" class="font-semibold hidden sm:inline-flex" @click="showReserveModal = true">
          {{ t.blockTime }}
        </UButton>
        <UButton v-if="canCreateMeetings" icon="i-heroicons-video-camera" color="primary" size="sm" class="font-semibold hidden sm:inline-flex" @click="showMeetingModal = true">
          {{ t.scheduleMeeting }}
        </UButton>
        <UButton v-if="canManageReservedDates" icon="i-heroicons-calendar" variant="soft" size="sm" class="sm:hidden" @click="showReserveModal = true" />
        <UButton v-if="canCreateMeetings" icon="i-heroicons-video-camera" color="primary" size="sm" class="sm:hidden" @click="showMeetingModal = true" />
      </div>
    </div>

    <!-- ═══════ STAT PILLS ═══════ -->
    <div class="flex items-center gap-3 animate-fade-up">
      <div class="flex items-center gap-2 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl px-3.5 py-2">
        <div class="w-2 h-2 rounded-full bg-emerald-500" />
        <span class="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{{ agendaTasks.length }} {{ t.tasksLabel }}</span>
      </div>
      <div class="flex items-center gap-2 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl px-3.5 py-2">
        <div class="w-2 h-2 rounded-full bg-blue-500" />
        <span class="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{{ agendaMeetings.length }} {{ t.meetingsLabel }}</span>
      </div>
      <div class="flex items-center gap-2 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl px-3.5 py-2">
        <div class="w-2 h-2 rounded-full bg-amber-500" />
        <span class="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{{ agendaReserved.length }} {{ t.reservedLabel }}</span>
      </div>
    </div>

    <!-- ═══════ LOADING ═══════ -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
        <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        </div>
        <span class="text-sm font-medium">{{ t.loading }}</span>
      </div>
    </div>

    <!-- ═══════ WEEKLY GRID ═══════ -->
    <div v-else class="agenda-grid-wrapper overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#141414] shadow-sm animate-fade-up">
      <table class="w-full border-collapse min-w-[800px]">
        <!-- Day headers -->
        <thead>
          <tr>
            <th class="sticky left-0 z-20 bg-gray-50/80 dark:bg-[#1a1a1a] backdrop-blur-sm w-[200px] min-w-[180px] px-4 py-3 text-left border-b border-r border-gray-100 dark:border-white/[0.06]">
              <span class="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">{{ lang.language.value === 'en' ? 'Team member' : 'Miembro' }}</span>
            </th>
            <th
              v-for="day in weekDays" :key="day.iso"
              class="px-2 py-3 border-b border-r border-gray-100 dark:border-white/[0.06] text-center min-w-[120px] transition-colors"
              :class="day.isToday
                ? 'bg-focusflow-50/60 dark:bg-focusflow-500/[0.06]'
                : 'bg-gray-50/80 dark:bg-[#1a1a1a]'"
            >
              <p class="text-[10px] font-semibold uppercase tracking-wider"
                :class="day.isToday ? 'text-focusflow-500' : 'text-gray-400 dark:text-gray-500'">
                {{ day.dayName }}
              </p>
              <div class="inline-flex items-center justify-center mt-0.5">
                <span
                  class="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors"
                  :class="day.isToday
                    ? 'bg-focusflow-500 text-white shadow-sm shadow-focusflow-500/30'
                    : 'text-gray-700 dark:text-gray-300'"
                >
                  {{ day.dayNum }}
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Member rows -->
        <tbody>
          <tr
            v-for="(member, idx) in members" :key="member.user_id"
            class="group/row hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <!-- Member cell -->
            <td class="sticky left-0 z-10 bg-white dark:bg-[#141414] group-hover/row:bg-gray-50/50 dark:group-hover/row:bg-white/[0.02] px-4 py-3 border-b border-r border-gray-100 dark:border-white/[0.06] transition-colors">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ring-2 ring-white dark:ring-[#141414] shadow-sm"
                  :class="member.user_id === currentUserId
                    ? 'bg-gradient-to-br from-focusflow-400 to-teal-500 text-white'
                    : memberColors[idx % memberColors.length]"
                >
                  {{ getInitials(member.email || member.user_id || '') }}
                </div>
                <div class="min-w-0">
                  <p class="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">
                    {{ memberDisplayName(member) }}
                  </p>
                  <p v-if="member.role" class="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{{ member.role }}</p>
                </div>
                <span v-if="member.user_id === currentUserId" class="ml-auto text-[8px] font-bold text-focusflow-500 bg-focusflow-50 dark:bg-focusflow-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">{{ t.you }}</span>
              </div>
            </td>

            <!-- Day cells -->
            <td
              v-for="day in weekDays" :key="day.iso"
              class="px-1 py-1.5 border-b border-r border-gray-100 dark:border-white/[0.06] align-top transition-colors"
              :class="day.isToday ? 'bg-focusflow-50/30 dark:bg-focusflow-500/[0.03]' : ''"
            >
              <div class="space-y-1 min-h-[52px]">
                <!-- Tasks -->
                <div
                  v-for="task in getMemberDayTasks(member.user_id, day.iso)" :key="'t-' + task.id"
                  class="group/chip flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-100 dark:border-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/20 transition-all cursor-default"
                >
                  <div class="w-1 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span class="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 truncate">{{ task.title }}</span>
                </div>

                <!-- Meetings -->
                <div
                  v-for="meeting in getMemberDayMeetings(member.user_id, day.iso)" :key="'m-' + meeting.id"
                  class="group/chip flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-100 dark:border-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/20 transition-all cursor-default"
                >
                  <UIcon name="i-heroicons-video-camera" class="w-3 h-3 text-blue-500 shrink-0" />
                  <span class="text-[10px] font-medium text-blue-800 dark:text-blue-300 truncate">{{ meeting.title }}</span>
                </div>

                <!-- Reserved dates -->
                <div
                  v-for="rd in getMemberDayReserved(member.user_id, day.iso)" :key="'r-' + rd.id"
                  class="group/chip flex items-center gap-1 px-2 py-1 rounded-md border transition-all"
                  :class="reservedChipClasses(rd.type)"
                >
                  <UIcon :name="reservedIcon(rd.type)" class="w-3 h-3 shrink-0" />
                  <span class="text-[10px] font-medium truncate flex-1">{{ rd.title }}</span>
                  <button
                    v-if="rd.user_id === currentUserId"
                    @click="deleteReserved(rd.id)"
                    class="w-3.5 h-3.5 rounded flex items-center justify-center opacity-0 group-hover/chip:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all shrink-0"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="members.length === 0">
            <td :colspan="8" class="py-16 text-center">
              <div class="flex flex-col items-center gap-3">
                <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                  <UIcon name="i-heroicons-user-group" class="w-7 h-7 text-gray-300 dark:text-gray-600" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">{{ t.noMembers }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ lang.language.value === 'en' ? 'Invite members to see their schedule' : 'Invita miembros para ver su agenda' }}</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══════ LEGEND ═══════ -->
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] animate-fade-up">
      <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <div class="w-1.5 h-3 rounded-full bg-emerald-500" />
        <span>{{ t.tasksLabel }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-video-camera" class="w-3 h-3 text-blue-500" />
        <span>{{ t.meetingsLabel }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-sun" class="w-3 h-3 text-rose-500" />
        <span>{{ t.vacation }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-user" class="w-3 h-3 text-violet-500" />
        <span>{{ t.personal }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-no-symbol" class="w-3 h-3 text-amber-500" />
        <span>{{ t.busy }}</span>
      </div>
    </div>

    <!-- Reserved date modal -->
    <ReservedDateModal
      v-if="store.workspace?.id"
      v-model:open="showReserveModal"
      :workspace-id="store.workspace.id"
      @created="onReservedCreated"
    />

    <!-- Meeting schedule modal -->
    <MeetingScheduleModal
      v-model:open="showMeetingModal"
      :workspace-id="store.workspace?.id || ''"
      :members="meetingMembers"
      :projects="projects"
      @created="onMeetingCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { Meeting, Project, ReservedDate } from '~/types'

definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()
const user = useSupabaseUser()
const lang = useLanguage()
const t = lang.labels
const { canManageReservedDates, canCreateMeetings } = usePermissions()

const loading = ref(true)
const weekOffset = ref(0)
const showReserveModal = ref(false)
const showMeetingModal = ref(false)

const members = ref<any[]>([])
const projects = ref<Project[]>([])
const agendaTasks = ref<any[]>([])
const agendaMeetings = ref<Meeting[]>([])
const agendaReserved = ref<ReservedDate[]>([])

const currentUserId = computed(() => user.value?.id || '')

// Rotating avatar palette for non-current-user members
const memberColors = [
  'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400',
  'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400',
  'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400',
  'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  'bg-lime-100 dark:bg-lime-500/15 text-lime-700 dark:text-lime-400',
  'bg-fuchsia-100 dark:bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400',
]

const weekStart = computed(() => {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  return addWeeks(start, weekOffset.value)
})

const weekDays = computed(() => {
  const days = []
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const dayNames = lang.language.value === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart.value, i)
    const iso = format(date, 'yyyy-MM-dd')
    days.push({
      iso,
      dayName: dayNames[i],
      dayNum: format(date, 'd'),
      isToday: iso === todayStr,
    })
  }
  return days
})

const weekLabel = computed(() => {
  const locale = lang.language.value === 'en' ? enUS : es
  const end = addDays(weekStart.value, 6)
  return `${format(weekStart.value, 'd MMM', { locale })} — ${format(end, 'd MMM yyyy', { locale })}`
})

const meetingMembers = computed(() =>
  members.value.map(m => ({ user_id: m.user_id, email: m.email || m.user_id, role: m.role })),
)

function changeWeek(delta: number) {
  weekOffset.value += delta
}

function goToday() {
  weekOffset.value = 0
}

function getInitials(s: string | null | undefined): string {
  if (!s) return '??'
  return s.split('@')[0]?.slice(0, 2)?.toUpperCase() || '??'
}

function memberDisplayName(member: any): string {
  if (member.email) {
    const local = member.email.split('@')[0] || ''
    // Capitalise first letter
    return local.charAt(0).toUpperCase() + local.slice(1)
  }
  return member.user_id ? member.user_id.slice(0, 12) : '—'
}

function getMemberDayTasks(userId: string, dayIso: string) {
  return agendaTasks.value.filter(t =>
    t.assignees?.includes(userId) && t.due_date?.startsWith(dayIso),
  )
}

function getMemberDayMeetings(userId: string, dayIso: string) {
  return agendaMeetings.value.filter(m =>
    m.attendees?.includes(userId) && m.scheduled_at?.startsWith(dayIso),
  )
}

function getMemberDayReserved(userId: string, dayIso: string) {
  return agendaReserved.value.filter(rd => {
    if (rd.user_id !== userId) return false
    const start = new Date(rd.start_at)
    const end = new Date(rd.end_at)
    const dayStart = new Date(dayIso + 'T00:00:00')
    const dayEnd = new Date(dayIso + 'T23:59:59')
    return start <= dayEnd && end >= dayStart
  })
}

function reservedChipClasses(type: string) {
  switch (type) {
    case 'vacation': return 'bg-rose-50 dark:bg-rose-500/[0.08] border-rose-100 dark:border-rose-500/10 text-rose-700 dark:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/20'
    case 'personal': return 'bg-violet-50 dark:bg-violet-500/[0.08] border-violet-100 dark:border-violet-500/10 text-violet-700 dark:text-violet-400 hover:border-violet-300 dark:hover:border-violet-500/20'
    default: return 'bg-amber-50 dark:bg-amber-500/[0.08] border-amber-100 dark:border-amber-500/10 text-amber-700 dark:text-amber-400 hover:border-amber-300 dark:hover:border-amber-500/20'
  }
}

function reservedIcon(type: string) {
  switch (type) {
    case 'vacation': return 'i-heroicons-sun'
    case 'personal': return 'i-heroicons-user'
    default: return 'i-heroicons-no-symbol'
  }
}

async function deleteReserved(id: string) {
  if (!store.workspace?.id) return
  try {
    await $fetch(`/api/workspaces/${store.workspace.id}/reserved-dates/${id}`, { method: 'DELETE' })
    agendaReserved.value = agendaReserved.value.filter(r => r.id !== id)
  } catch {}
}

function onReservedCreated(data: any) {
  agendaReserved.value.push(data)
}

function onMeetingCreated(meeting: Meeting) {
  agendaMeetings.value.push(meeting)
}

async function loadData() {
  if (!store.workspace?.id) return
  loading.value = true

  const days = weekDays.value
  if (days.length < 7) return
  const from = days[0]!.iso + 'T00:00:00Z'
  const to = days[6]!.iso + 'T23:59:59Z'

  try {
    const [membersData, projectsData, agendaData] = await Promise.all([
      $fetch<any[]>(`/api/workspaces/${store.workspace.id}/members`),
      $fetch<Project[]>(`/api/workspaces/${store.workspace.id}/projects`),
      $fetch<any>(`/api/workspaces/${store.workspace.id}/agenda`, { query: { from, to } }),
    ])

    members.value = membersData || []
    projects.value = projectsData || []
    agendaTasks.value = agendaData?.tasks || []
    agendaMeetings.value = agendaData?.meetings || []
    agendaReserved.value = agendaData?.reservedDates || []
  } catch {}

  loading.value = false
}

watch([() => store.workspace?.id, weekOffset], () => {
  loadData()
}, { immediate: true })
</script>

<style scoped>
.agenda-grid-wrapper {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}
.agenda-grid-wrapper::-webkit-scrollbar {
  height: 6px;
}
.agenda-grid-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
.agenda-grid-wrapper::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}
</style>
