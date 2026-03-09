<script setup lang="ts">
import type { Sprint } from '~/types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { labels } = useLanguage()
const { canViewReports } = usePermissions()

const workspaceId = computed(() => workspaceStore.workspace?.id || '')
const projectId = computed(() => route.params.id as string)

const sprints = ref<Sprint[]>([])
const selectedSprintId = ref<string>('')
const loading = ref(true)

async function fetchSprints() {
  if (!workspaceId.value || !projectId.value) return
  try {
    sprints.value = await $fetch<Sprint[]>(
      `/api/workspaces/${workspaceId.value}/projects/${projectId.value}/sprints`,
    )
    // Default to active sprint
    const active = sprints.value.find(s => s.status === 'active')
    if (active) selectedSprintId.value = active.id
    else if (sprints.value.length > 0) selectedSprintId.value = sprints.value[0].id
  } catch (err) {
    console.error('[Reports] fetch sprints error:', err)
  } finally {
    loading.value = false
  }
}

watch(workspaceId, () => { if (workspaceId.value) fetchSprints() }, { immediate: true })
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ labels.reports }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ labels.sprintReport }}</p>
      </div>

      <select
        v-model="selectedSprintId"
        class="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
      >
        <option value="">{{ labels.all }}</option>
        <option v-for="sprint in sprints" :key="sprint.id" :value="sprint.id">
          {{ sprint.name }} ({{ sprint.status }})
        </option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-500 dark:text-gray-400">{{ labels.loading }}</div>

    <div v-else-if="!canViewReports" class="text-center py-16 text-gray-500 dark:text-gray-400">
      {{ labels.noResults }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BurndownChart
        :workspace-id="workspaceId"
        :project-id="projectId"
        :sprint-id="selectedSprintId || undefined"
      />

      <VelocityChart
        :workspace-id="workspaceId"
        :project-id="projectId"
      />

      <CumulativeFlowChart
        :workspace-id="workspaceId"
        :project-id="projectId"
      />

      <CycleTimeChart
        :workspace-id="workspaceId"
        :project-id="projectId"
      />
    </div>

    <!-- Sprint panel -->
    <div class="mt-6">
      <SprintPanel
        :workspace-id="workspaceId"
        :project-id="projectId"
        @sprint-changed="fetchSprints"
      />
    </div>
  </div>
</template>
