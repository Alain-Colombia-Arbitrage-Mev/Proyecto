<script setup lang="ts">
import type { TaskRelationship } from '~/types'

const props = defineProps<{
  taskId: string
  workspaceId: string
}>()

const { labels } = useLanguage()
const { canEditTasks } = usePermissions()

const relationships = ref<(TaskRelationship & { task_title?: string })[]>([])
const loading = ref(true)
const showAdd = ref(false)
const newTargetTaskId = ref('')
const newType = ref<'blocks' | 'relates_to' | 'duplicates'>('relates_to')

async function fetchRelationships() {
  try {
    const data = await $fetch<(TaskRelationship & { task_title?: string })[]>(
      `/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/relationships`,
    )
    relationships.value = data || []
  } catch (err) {
    console.error('[TaskRelationships] fetch error:', err)
  } finally {
    loading.value = false
  }
}

async function addRelationship() {
  if (!newTargetTaskId.value.trim()) return
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/relationships`, {
      method: 'POST',
      body: { target_task_id: newTargetTaskId.value, relationship_type: newType.value },
    })
    await fetchRelationships()
    showAdd.value = false
    newTargetTaskId.value = ''
  } catch (err) {
    console.error('[TaskRelationships] add error:', err)
  }
}

async function removeRelationship(relId: string) {
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/relationships/${relId}`, { method: 'DELETE' })
    relationships.value = relationships.value.filter(r => r.id !== relId)
  } catch (err) {
    console.error('[TaskRelationships] remove error:', err)
  }
}

function getTypeLabel(type: string, isTarget: boolean): string {
  if (type === 'blocks') return isTarget ? labels.value.blocks : labels.value.blockedBy
  if (type === 'duplicates') return isTarget ? labels.value.duplicates : labels.value.duplicatedBy
  return labels.value.relatesTo
}

const typeOptions = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'relates_to', label: 'Relates to' },
  { value: 'duplicates', label: 'Duplicates' },
]

onMounted(fetchRelationships)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ labels.relationships }}</h3>
      <button
        v-if="canEditTasks && !showAdd"
        @click="showAdd = true"
        class="text-xs text-gray-500 hover:text-focusflow-600 dark:text-gray-400"
      >
        + {{ labels.addRelationship }}
      </button>
    </div>

    <!-- Add form -->
    <div v-if="showAdd" class="mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2">
      <input
        v-model="newTargetTaskId"
        :placeholder="labels.selectTask"
        class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-focusflow-500"
      />
      <select
        v-model="newType"
        class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5"
      >
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <div class="flex gap-2">
        <button @click="addRelationship" class="px-3 py-1 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600">
          {{ labels.save }}
        </button>
        <button @click="showAdd = false" class="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
          {{ labels.cancel }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-400">{{ labels.loading }}</div>

    <div v-else-if="relationships.length === 0" class="text-sm text-gray-400">{{ labels.noRelationships }}</div>

    <div v-else class="space-y-1">
      <div
        v-for="rel in relationships"
        :key="rel.id"
        class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
      >
        <span class="text-xs font-medium px-1.5 py-0.5 rounded"
          :class="{
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': rel.relationship_type === 'blocks',
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': rel.relationship_type === 'relates_to',
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': rel.relationship_type === 'duplicates',
          }"
        >
          {{ getTypeLabel(rel.relationship_type, rel.source_task_id === taskId) }}
        </span>
        <span class="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
          {{ rel.task_title || (rel.source_task_id === taskId ? rel.target_task_id : rel.source_task_id) }}
        </span>
        <button
          v-if="canEditTasks"
          @click="removeRelationship(rel.id)"
          class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
