<script setup lang="ts">
import type { TimesheetRow, TimeEntry } from '~/types'

const props = defineProps<{
  workspaceId: string
}>()

const { labels, language } = useLanguage()

const loading = ref(true)
const rows = ref<TimesheetRow[]>([])
const weeklyTotal = ref(0)
const weekStart = ref('')
onMounted(() => { weekStart.value = getMonday(new Date()).toISOString().slice(0, 10) })
const showEntryForm = ref(false)

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

const weekDays = computed(() => {
  const start = new Date(weekStart.value)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
})

function formatDay(d: Date): string {
  const dayNames = language.value === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return `${dayNames[d.getDay()]} ${d.getDate()}`
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d.toISOString().slice(0, 10)
  fetchTimesheet()
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d.toISOString().slice(0, 10)
  fetchTimesheet()
}

async function fetchTimesheet() {
  if (!props.workspaceId) { loading.value = false; return }
  loading.value = true
  try {
    const data = await $fetch<{ rows: TimesheetRow[]; weekly_total: number }>(
      `/api/workspaces/${props.workspaceId}/timesheet`,
      { params: { week_start: weekStart.value } },
    )
    rows.value = data.rows || []
    weeklyTotal.value = data.weekly_total || 0
  } catch (err) {
    console.error('[TimesheetGrid] fetch error:', err)
  } finally {
    loading.value = false
  }
}

function onEntrySaved() {
  showEntryForm.value = false
  fetchTimesheet()
}

function isToday(d: Date): boolean {
  const today = new Date()
  return d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
}

watch(() => props.workspaceId, (id) => { if (id) fetchTimesheet() }, { immediate: true })
</script>

<template>
  <div>
    <!-- Header with navigation -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <button @click="prevWeek" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
        </button>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ weekDays[0]?.toLocaleDateString() }} — {{ weekDays[6]?.toLocaleDateString() }}
        </span>
        <button @click="nextWeek" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5" />
        </button>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ labels.weeklyTotal }}: {{ formatMinutes(weeklyTotal) }}
        </span>
        <button
          @click="showEntryForm = !showEntryForm"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600"
        >
          {{ labels.addTimeEntry }}
        </button>
      </div>
    </div>

    <!-- Manual entry form -->
    <div v-if="showEntryForm" class="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <TimeEntryForm
        :workspace-id="workspaceId"
        @saved="onEntrySaved"
        @cancel="showEntryForm = false"
      />
    </div>

    <div v-if="loading" class="text-sm text-gray-400 text-center py-8">{{ labels.loading }}</div>

    <!-- Weekly grid -->
    <div v-else class="grid grid-cols-7 gap-1">
      <!-- Day headers -->
      <div
        v-for="day in weekDays"
        :key="day.toISOString()"
        class="text-center py-2 text-xs font-medium"
        :class="isToday(day) ? 'text-focusflow-600 dark:text-focusflow-400' : 'text-gray-500 dark:text-gray-400'"
      >
        {{ formatDay(day) }}
      </div>

      <!-- Day cells -->
      <div
        v-for="(day, idx) in weekDays"
        :key="'cell-' + idx"
        class="min-h-[80px] p-2 rounded-lg border"
        :class="isToday(day)
          ? 'border-focusflow-300 dark:border-focusflow-700 bg-focusflow-50/50 dark:bg-focusflow-900/10'
          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50'"
      >
        <template v-if="rows[idx]">
          <div class="text-xs font-semibold mb-1"
            :class="rows[idx].total_minutes > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-700'"
          >
            {{ formatMinutes(rows[idx].total_minutes) }}
          </div>
          <div v-for="entry in rows[idx].entries.slice(0, 3)" :key="entry.id" class="text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5">
            {{ entry.description || (entry.duration_minutes ? formatMinutes(entry.duration_minutes) : '—') }}
          </div>
          <div v-if="rows[idx].entries.length > 3" class="text-xs text-gray-400">
            +{{ rows[idx].entries.length - 3 }} {{ labels.more }}
          </div>
        </template>
        <span v-else class="text-xs text-gray-300 dark:text-gray-700">—</span>
      </div>
    </div>
  </div>
</template>
