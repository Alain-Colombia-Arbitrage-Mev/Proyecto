<script setup lang="ts">
import type { VelocityPoint } from '~/types'

const props = defineProps<{
  workspaceId: string
  projectId: string
}>()

const { labels } = useLanguage()
const points = ref<VelocityPoint[]>([])
const loading = ref(true)

async function fetchData() {
  if (!props.workspaceId || !props.projectId) { loading.value = false; return }
  try {
    const data = await $fetch<{ points: VelocityPoint[] }>(
      `/api/workspaces/${props.workspaceId}/projects/${props.projectId}/velocity`,
    )
    points.value = data.points || []
  } catch (err) {
    console.error('[VelocityChart] fetch error:', err)
  } finally {
    loading.value = false
  }
}

const maxPoints = computed(() => Math.max(...points.value.map(p => p.points), 1))

function barHeight(val: number): number {
  return (val / maxPoints.value) * 120
}

watch(() => props.workspaceId, (id) => { if (id) fetchData() }, { immediate: true })
</script>

<template>
  <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ labels.velocityChart }}</h3>

    <div v-if="loading" class="text-sm text-gray-400 py-4 text-center">{{ labels.loading }}</div>

    <div v-else-if="points.length === 0" class="text-sm text-gray-400 py-4 text-center">{{ labels.noResults }}</div>

    <div v-else class="flex items-end gap-2 h-[140px]">
      <div v-for="point in points" :key="point.sprint" class="flex flex-col items-center flex-1">
        <span class="text-xs font-semibold text-gray-900 dark:text-white mb-1">{{ point.points }}</span>
        <div
          class="w-full rounded-t-lg bg-focusflow-500 transition-all duration-500"
          :style="{ height: `${barHeight(point.points)}px` }"
        />
        <span class="text-[9px] text-gray-400 mt-1 truncate w-full text-center">{{ point.sprint }}</span>
      </div>
    </div>
  </div>
</template>
