<script setup lang="ts">
import type { GoalLink } from '~/types'

const props = defineProps<{
  workspaceId: string
  goalId: string
}>()

const { labels } = useLanguage()
const { canManageGoals } = usePermissions()

const links = ref<(GoalLink & { entity_name?: string })[]>([])
const loading = ref(true)
const showAdd = ref(false)
const entityType = ref<'project' | 'task'>('project')
const entityId = ref('')

async function fetchLinks() {
  try {
    const progress = await $fetch<{ linked_entities: number }>(`/api/workspaces/${props.workspaceId}/goals/${props.goalId}/progress`)
    // For now, just show a summary; full link list would need a dedicated endpoint
    loading.value = false
  } catch {
    loading.value = false
  }
}

async function addLink() {
  if (!entityId.value.trim()) return
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/goals/${props.goalId}/links`, {
      method: 'POST',
      body: { entity_type: entityType.value, entity_id: entityId.value },
    })
    showAdd.value = false
    entityId.value = ''
    fetchLinks()
  } catch (err) {
    console.error('[GoalLinkPicker] add error:', err)
  }
}

watch(() => props.workspaceId, (id) => { if (id) fetchLinks() }, { immediate: true })
</script>

<template>
  <div>
    <div class="flex items-center gap-2">
      <button
        v-if="canManageGoals && !showAdd"
        @click="showAdd = true"
        class="text-xs text-gray-500 hover:text-focusflow-600 dark:text-gray-400"
      >
        + {{ labels.linkProject }}
      </button>
    </div>

    <div v-if="showAdd" class="mt-2 space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <select v-model="entityType" class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5">
        <option value="project">{{ labels.project }}</option>
        <option value="task">Task</option>
      </select>
      <input v-model="entityId" placeholder="Entity ID" class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5" />
      <div class="flex gap-2">
        <button @click="addLink" class="px-3 py-1 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600">{{ labels.save }}</button>
        <button @click="showAdd = false" class="px-3 py-1 text-xs text-gray-500">{{ labels.cancel }}</button>
      </div>
    </div>
  </div>
</template>
