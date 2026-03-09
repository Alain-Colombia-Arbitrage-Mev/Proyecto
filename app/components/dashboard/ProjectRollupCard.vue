<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
  projectId: string
  projectName: string
  projectColor: string
}>()

const { labels } = useLanguage()

interface ProjectRollup {
  total_tasks: number
  completed_tasks: number
  open_tasks: number
  completion_rate: number
  total_time_minutes: number
}

const data = ref<ProjectRollup | null>(null)

async function fetchRollup() {
  if (!props.workspaceId || !props.projectId) return
  try {
    data.value = await $fetch<ProjectRollup>(`/api/workspaces/${props.workspaceId}/projects/${props.projectId}/rollups`)
  } catch { /* silent */ }
}

watch(() => props.workspaceId, (id) => { if (id) fetchRollup() }, { immediate: true })
</script>

<template>
  <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
    <div class="flex items-center gap-2 mb-3">
      <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: projectColor }" />
      <span class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ projectName }}</span>
    </div>

    <div v-if="data" class="space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-500 dark:text-gray-400">{{ labels.completionRate }}</span>
        <span class="font-semibold text-gray-900 dark:text-white">{{ data.completion_rate }}%</span>
      </div>
      <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{ width: `${data.completion_rate}%`, backgroundColor: projectColor }"
        />
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{{ data.completed_tasks }}/{{ data.total_tasks }} {{ labels.tasks }}</span>
        <span>{{ data.open_tasks }} {{ labels.openTasks.toLowerCase() }}</span>
      </div>
    </div>

    <div v-else class="text-xs text-gray-500 dark:text-gray-400">{{ labels.loading }}</div>
  </div>
</template>
