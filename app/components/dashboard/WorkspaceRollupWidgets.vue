<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
}>()

const { labels } = useLanguage()

interface RollupData {
  total_tasks: number
  completed_tasks: number
  open_tasks: number
  completion_rate: number
  projects_count: number
  active_projects: number
  total_time_minutes: number
}

const data = ref<RollupData | null>(null)
const loading = ref(true)

async function fetchRollups() {
  if (!props.workspaceId) { loading.value = false; return }
  try {
    data.value = await $fetch<RollupData>(`/api/workspaces/${props.workspaceId}/rollups`)
  } catch (err) {
    console.error('[WorkspaceRollupWidgets] fetch error:', err)
  } finally {
    loading.value = false
  }
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

watch(() => props.workspaceId, (id) => { if (id) fetchRollups() }, { immediate: true })
</script>

<template>
  <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">{{ labels.loading }}</div>

  <div v-else-if="data" class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ data.completion_rate }}%</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ labels.completionRate }}</p>
    </div>

    <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ data.open_tasks }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ labels.openTasks }}</p>
    </div>

    <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ data.active_projects }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ labels.projects }}</p>
    </div>

    <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatTime(data.total_time_minutes) }}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ labels.totalTime }}</p>
    </div>
  </div>
</template>
