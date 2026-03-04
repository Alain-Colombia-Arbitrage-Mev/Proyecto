<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const workspaceSlug = route.params.workspace as string
const workspaceStore = useWorkspaceStore()
const { labels } = useLanguage()
const { canViewTimesheets } = usePermissions()
const { isRunning, startTimer } = useTimeTracker()

const workspaceId = computed(() => workspaceStore.workspace?.id || '')

function handleStartTimer() {
  if (!workspaceId.value) return
  startTimer({ workspaceId: workspaceId.value })
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ labels.timesheet }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ labels.timeTracking }}</p>
      </div>

      <button
        v-if="!isRunning"
        @click="handleStartTimer"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-focusflow-500 text-white hover:bg-focusflow-600 transition-colors"
      >
        <UIcon name="i-heroicons-play" class="w-4 h-4" />
        {{ labels.startTimer }}
      </button>
      <div v-else class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        {{ labels.timerRunning }}
      </div>
    </div>

    <!-- Timesheet grid -->
    <div v-if="canViewTimesheets && workspaceId" class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <TimesheetGrid :workspace-id="workspaceId" />
    </div>

    <div v-else class="text-center py-16 text-gray-400">
      {{ labels.noTimeEntries }}
    </div>
  </div>
</template>
