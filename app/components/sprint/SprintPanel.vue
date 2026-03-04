<script setup lang="ts">
import type { Sprint } from '~/types'

const props = defineProps<{
  workspaceId: string
  projectId: string
}>()

const emit = defineEmits<{
  'sprint-changed': [sprint: Sprint | null]
}>()

const { labels } = useLanguage()
const { canManageSprints } = usePermissions()

const sprints = ref<Sprint[]>([])
const loading = ref(true)
const showCreate = ref(false)

const form = reactive({
  name: '',
  goal: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
})

const activeSprint = computed(() => sprints.value.find(s => s.status === 'active') || null)

async function fetchSprints() {
  if (!props.workspaceId || !props.projectId) { loading.value = false; return }
  try {
    sprints.value = await $fetch<Sprint[]>(`/api/workspaces/${props.workspaceId}/projects/${props.projectId}/sprints`)
  } catch (err) {
    console.error('[SprintPanel] fetch error:', err)
  } finally {
    loading.value = false
  }
}

async function createSprint() {
  if (!form.name.trim()) return
  try {
    const sprint = await $fetch<Sprint>(`/api/workspaces/${props.workspaceId}/projects/${props.projectId}/sprints`, {
      method: 'POST',
      body: { name: form.name, goal: form.goal || undefined, start_date: form.start_date, end_date: form.end_date },
    })
    sprints.value.push(sprint)
    showCreate.value = false
    form.name = ''
    form.goal = ''
  } catch (err) {
    console.error('[SprintPanel] create error:', err)
  }
}

async function updateSprintStatus(sprintId: string, status: string) {
  try {
    const updated = await $fetch<Sprint>(
      `/api/workspaces/${props.workspaceId}/projects/${props.projectId}/sprints/${sprintId}`,
      { method: 'PATCH', body: { status } },
    )
    const idx = sprints.value.findIndex(s => s.id === sprintId)
    if (idx >= 0) sprints.value[idx] = updated
    // If completing, also refresh to update other sprints
    if (status === 'active' || status === 'completed') await fetchSprints()
    emit('sprint-changed', activeSprint.value)
  } catch (err) {
    console.error('[SprintPanel] update error:', err)
  }
}

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

watch(() => props.workspaceId, (id) => { if (id) fetchSprints() }, { immediate: true })
</script>

<template>
  <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ labels.sprints }}</h3>
      <button
        v-if="canManageSprints && !showCreate"
        @click="showCreate = true"
        class="text-xs text-gray-500 hover:text-focusflow-600 dark:text-gray-400"
      >
        + {{ labels.createSprint }}
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="mb-3 space-y-2">
      <input v-model="form.name" :placeholder="labels.sprintName" class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5" />
      <input v-model="form.goal" :placeholder="labels.sprintGoal" class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5" />
      <div class="grid grid-cols-2 gap-2">
        <input v-model="form.start_date" type="date" class="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5" />
        <input v-model="form.end_date" type="date" class="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5" />
      </div>
      <div class="flex gap-2">
        <button @click="createSprint" class="px-3 py-1 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600">{{ labels.save }}</button>
        <button @click="showCreate = false" class="px-3 py-1 text-xs text-gray-500">{{ labels.cancel }}</button>
      </div>
    </div>

    <!-- Sprint list -->
    <div v-if="loading" class="text-xs text-gray-400">{{ labels.loading }}</div>

    <div v-else-if="sprints.length === 0" class="text-xs text-gray-400">{{ labels.noSprints }}</div>

    <div v-else class="space-y-2">
      <div v-for="sprint in sprints" :key="sprint.id" class="flex items-center gap-2 text-sm">
        <span class="px-1.5 py-0.5 rounded text-xs font-medium" :class="statusColors[sprint.status] || ''">
          {{ sprint.status }}
        </span>
        <span class="text-gray-700 dark:text-gray-300 truncate flex-1">{{ sprint.name }}</span>
        <span class="text-xs text-gray-400">{{ sprint.start_date?.slice(5) }} → {{ sprint.end_date?.slice(5) }}</span>

        <template v-if="canManageSprints">
          <button v-if="sprint.status === 'planned'" @click="updateSprintStatus(sprint.id, 'active')" class="text-xs text-focusflow-600 hover:text-focusflow-700">
            {{ labels.startSprint }}
          </button>
          <button v-if="sprint.status === 'active'" @click="updateSprintStatus(sprint.id, 'completed')" class="text-xs text-amber-600 hover:text-amber-700">
            {{ labels.completeSprint }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
