<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
  projectId: string
}>()

const { labels } = useLanguage()
const loading = ref(true)
const data = ref<{ avg_hours: number; by_column: { column_name: string; avg_hours: number }[] }>({ avg_hours: 0, by_column: [] })

async function fetchData() {
  if (!props.workspaceId || !props.projectId) { loading.value = false; return }
  try {
    data.value = await $fetch(`/api/workspaces/${props.workspaceId}/projects/${props.projectId}/cycle-time`)
  } catch (err) {
    console.error('[CycleTimeChart] fetch error:', err)
  } finally {
    loading.value = false
  }
}

const maxHours = computed(() => Math.max(...data.value.by_column.map(c => c.avg_hours), 1))

watch(() => props.workspaceId, (id) => { if (id) fetchData() }, { immediate: true })
</script>

<template>
  <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">{{ labels.cycleTime }}</h3>
    <p class="text-xs text-gray-400 mb-3">Avg: {{ data.avg_hours.toFixed(1) }}h</p>

    <div v-if="loading" class="text-sm text-gray-400 py-4 text-center">{{ labels.loading }}</div>

    <div v-else-if="data.by_column.length === 0" class="text-sm text-gray-400 py-4 text-center">{{ labels.noResults }}</div>

    <div v-else class="space-y-2">
      <div v-for="col in data.by_column" :key="col.column_name" class="flex items-center gap-3">
        <span class="text-xs text-gray-600 dark:text-gray-400 w-24 truncate text-right">{{ col.column_name }}</span>
        <div class="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-focusflow-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
            :style="{ width: `${(col.avg_hours / maxHours) * 100}%` }"
          >
            <span v-if="col.avg_hours > 0" class="text-[9px] font-medium text-white">{{ col.avg_hours.toFixed(1) }}h</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
