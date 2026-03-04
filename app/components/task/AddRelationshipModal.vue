<script setup lang="ts">
import type { Task, RelationshipType } from '~/types'

const props = defineProps<{
  workspaceId: string
  taskId: string
  projectId: string
}>()

const emit = defineEmits<{
  'created': []
  'close': []
}>()

const { labels } = useLanguage()
const loading = ref(false)
const searchQuery = ref('')
const tasks = ref<Task[]>([])
const selectedTaskId = ref('')
const relType = ref<RelationshipType>('relates_to')

async function searchTasks() {
  if (!searchQuery.value.trim()) return
  try {
    const data = await $fetch<{ data: Task[] }>(`/api/workspaces/${props.workspaceId}/tasks`, {
      params: { search: searchQuery.value, project_id: props.projectId, limit: 10 },
    })
    tasks.value = (data.data || []).filter(t => t.id !== props.taskId)
  } catch (err) {
    console.error('[AddRelationshipModal] search error:', err)
  }
}

async function create() {
  if (!selectedTaskId.value) return
  loading.value = true
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/relationships`, {
      method: 'POST',
      body: { target_task_id: selectedTaskId.value, relationship_type: relType.value },
    })
    emit('created')
  } catch (err) {
    console.error('[AddRelationshipModal] create error:', err)
  } finally {
    loading.value = false
  }
}

const typeOptions: { value: RelationshipType; label: string }[] = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'relates_to', label: 'Relates to' },
  { value: 'duplicates', label: 'Duplicates' },
]
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ labels.addRelationship }}</h2>

      <div class="space-y-4">
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.relationshipType }}</label>
          <select v-model="relType" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.selectTask }}</label>
          <div class="flex gap-2 mt-1">
            <input
              v-model="searchQuery"
              @keydown.enter.prevent="searchTasks"
              :placeholder="labels.search"
              class="flex-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            />
            <button @click="searchTasks" class="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              {{ labels.search }}
            </button>
          </div>
        </div>

        <div v-if="tasks.length > 0" class="max-h-40 overflow-y-auto space-y-1">
          <button
            v-for="task in tasks"
            :key="task.id"
            @click="selectedTaskId = task.id"
            class="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
            :class="selectedTaskId === task.id
              ? 'bg-focusflow-50 dark:bg-focusflow-950/30 text-focusflow-700 dark:text-focusflow-400'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'"
          >
            {{ task.title }}
          </button>
        </div>

        <div class="flex gap-2 pt-2">
          <button
            @click="create"
            :disabled="!selectedTaskId || loading"
            class="px-4 py-2 text-sm font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600 disabled:opacity-50"
          >
            {{ loading ? labels.loading : labels.save }}
          </button>
          <button @click="emit('close')" class="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            {{ labels.cancel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
