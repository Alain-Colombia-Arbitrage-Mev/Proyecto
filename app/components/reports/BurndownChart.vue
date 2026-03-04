<script setup lang="ts">
import type { BurndownPoint } from '~/types'

const props = defineProps<{
  workspaceId: string
  projectId: string
  sprintId?: string
}>()

const { labels } = useLanguage()
const points = ref<BurndownPoint[]>([])
const loading = ref(true)

async function fetchData() {
  if (!props.sprintId) { loading.value = false; return }
  try {
    const data = await $fetch<{ points: BurndownPoint[] }>(
      `/api/workspaces/${props.workspaceId}/projects/${props.projectId}/burndown`,
      { params: { sprint_id: props.sprintId } },
    )
    points.value = data.points || []
  } catch (err) {
    console.error('[BurndownChart] fetch error:', err)
  } finally {
    loading.value = false
  }
}

// SVG chart dimensions
const width = 400
const height = 200
const padding = 30

const maxVal = computed(() => Math.max(...points.value.map(p => Math.max(p.remaining, p.ideal)), 1))

function x(i: number): number {
  if (points.value.length <= 1) return padding
  return padding + (i / (points.value.length - 1)) * (width - padding * 2)
}

function y(val: number): number {
  return height - padding - ((val / maxVal.value) * (height - padding * 2))
}

const actualLine = computed(() => {
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.remaining)}`).join(' ')
})

const idealLine = computed(() => {
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.ideal)}`).join(' ')
})

watch(() => props.sprintId, fetchData, { immediate: true })
</script>

<template>
  <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ labels.burndownChart }}</h3>

    <div v-if="loading" class="text-sm text-gray-400 py-4 text-center">{{ labels.loading }}</div>

    <div v-else-if="points.length === 0" class="text-sm text-gray-400 py-4 text-center">{{ labels.noResults }}</div>

    <svg v-else :viewBox="`0 0 ${width} ${height}`" class="w-full h-auto">
      <!-- Grid -->
      <line :x1="padding" :y1="height - padding" :x2="width - padding" :y2="height - padding" stroke="currentColor" class="text-gray-200 dark:text-gray-700" stroke-width="1" />
      <line :x1="padding" :y1="padding" :x2="padding" :y2="height - padding" stroke="currentColor" class="text-gray-200 dark:text-gray-700" stroke-width="1" />

      <!-- Ideal line (dashed) -->
      <path :d="idealLine" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5,5" />

      <!-- Actual line -->
      <path :d="actualLine" fill="none" stroke="#14b8a6" stroke-width="2.5" />

      <!-- Points -->
      <circle v-for="(p, i) in points" :key="i" :cx="x(i)" :cy="y(p.remaining)" r="3" fill="#14b8a6" />

      <!-- Labels -->
      <text v-if="points.length > 0" :x="padding" :y="height - 8" class="text-[8px] fill-gray-400">{{ points[0].date.slice(5) }}</text>
      <text v-if="points.length > 1" :x="width - padding" :y="height - 8" text-anchor="end" class="text-[8px] fill-gray-400">{{ points[points.length - 1].date.slice(5) }}</text>
    </svg>

    <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
      <span class="flex items-center gap-1"><span class="w-3 h-0.5 bg-teal-500 inline-block" /> Actual</span>
      <span class="flex items-center gap-1"><span class="w-3 h-0.5 bg-gray-400 inline-block border-dashed" style="border-top: 1.5px dashed #94a3b8; height:0;" /> Ideal</span>
    </div>
  </div>
</template>
