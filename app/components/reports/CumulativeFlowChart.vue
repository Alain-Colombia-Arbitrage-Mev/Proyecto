<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
  projectId: string
}>()

const { labels } = useLanguage()
const loading = ref(true)
const chartData = ref<{ dates: string[]; columns: { name: string; counts: number[] }[] }>({ dates: [], columns: [] })

async function fetchData() {
  if (!props.workspaceId || !props.projectId) { loading.value = false; return }
  try {
    chartData.value = await $fetch(`/api/workspaces/${props.workspaceId}/projects/${props.projectId}/cumulative-flow`)
  } catch (err) {
    console.error('[CumulativeFlowChart] fetch error:', err)
  } finally {
    loading.value = false
  }
}

const colors = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#6366f1']

const svgWidth = 400
const svgHeight = 200
const padding = 30

const maxTotal = computed(() => {
  if (chartData.value.dates.length === 0) return 1
  let max = 0
  for (let i = 0; i < chartData.value.dates.length; i++) {
    let sum = 0
    for (const col of chartData.value.columns) sum += col.counts[i] || 0
    if (sum > max) max = sum
  }
  return max || 1
})

watch(() => props.workspaceId, (id) => { if (id) fetchData() }, { immediate: true })
</script>

<template>
  <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ labels.cumulativeFlow }}</h3>

    <div v-if="loading" class="text-sm text-gray-400 py-4 text-center">{{ labels.loading }}</div>

    <div v-else-if="chartData.dates.length === 0" class="text-sm text-gray-400 py-4 text-center">{{ labels.noResults }}</div>

    <div v-else>
      <!-- Simple stacked bar representation -->
      <div class="flex items-end gap-px h-[160px]">
        <div
          v-for="(date, i) in chartData.dates"
          :key="date"
          class="flex-1 flex flex-col-reverse"
        >
          <div
            v-for="(col, j) in chartData.columns"
            :key="col.name"
            :style="{
              height: `${((col.counts[i] || 0) / maxTotal) * 140}px`,
              backgroundColor: colors[j % colors.length],
            }"
            class="w-full transition-all duration-300"
            :title="`${col.name}: ${col.counts[i] || 0}`"
          />
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-3 mt-3">
        <span v-for="(col, j) in chartData.columns" :key="col.name" class="flex items-center gap-1 text-xs text-gray-500">
          <span class="w-2.5 h-2.5 rounded-sm" :style="{ backgroundColor: colors[j % colors.length] }" />
          {{ col.name }}
        </span>
      </div>
    </div>
  </div>
</template>
