<script setup lang="ts">
import type { Task } from '~/types'

const props = defineProps<{
  taskId: string
  workspaceId: string
  parentDepth?: number
}>()

const { labels } = useLanguage()
const { canCreateTasks } = usePermissions()

const subtasks = ref<Task[]>([])
const loading = ref(true)

const maxDepth = 3
const currentDepth = (props.parentDepth ?? 0) + 1
const canNestMore = currentDepth < maxDepth

const completedCount = computed(() => subtasks.value.filter(t => t.column_id === null || t.tags?.includes('done')).length)
const totalCount = computed(() => subtasks.value.length)
const progressPercent = computed(() => totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0)

async function fetchSubtasks() {
  try {
    const data = await $fetch<Task[]>(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/subtasks`)
    subtasks.value = data || []
  } catch (err) {
    console.error('[SubtaskList] fetch error:', err)
  } finally {
    loading.value = false
  }
}

function onSubtaskCreated(task: unknown) {
  subtasks.value.push(task as Task)
}

onMounted(fetchSubtasks)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ labels.subtasks }}
        <span v-if="totalCount > 0" class="text-gray-400 font-normal ml-1">
          ({{ completedCount }}/{{ totalCount }})
        </span>
      </h3>
    </div>

    <!-- Progress bar -->
    <div v-if="totalCount > 0" class="mb-3">
      <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-focusflow-500 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <p class="text-xs text-gray-400 mt-0.5">{{ progressPercent }}%</p>
    </div>

    <div v-if="loading" class="text-sm text-gray-400">{{ labels.loading }}</div>

    <div v-else>
      <!-- Subtask list -->
      <div v-if="subtasks.length > 0" class="space-y-1">
        <div
          v-for="subtask in subtasks"
          :key="subtask.id"
          class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
        >
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="{
              'bg-green-500': subtask.tags?.includes('done'),
              'bg-yellow-500': subtask.tags?.includes('in_progress'),
              'bg-gray-300 dark:bg-gray-600': !subtask.tags?.includes('done') && !subtask.tags?.includes('in_progress'),
            }"
          />
          <span class="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{{ subtask.title }}</span>
          <span
            v-if="subtask.priority"
            class="text-xs px-1.5 py-0.5 rounded"
            :class="{
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': subtask.priority === 'critical',
              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': subtask.priority === 'high',
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': subtask.priority === 'medium',
              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400': subtask.priority === 'low',
            }"
          >
            {{ subtask.priority }}
          </span>
        </div>
      </div>

      <p v-else class="text-sm text-gray-400 py-1">{{ labels.noSubtasks }}</p>

      <!-- Inline create -->
      <div class="mt-2">
        <SubtaskCreateInline
          v-if="canCreateTasks && canNestMore"
          :workspace-id="workspaceId"
          :parent-task-id="taskId"
          @created="onSubtaskCreated"
        />
        <p v-else-if="!canNestMore && canCreateTasks" class="text-xs text-gray-400 italic">
          {{ labels.maxDepthReached }}
        </p>
      </div>
    </div>
  </div>
</template>
