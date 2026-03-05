<script setup lang="ts">
import type { TimeEntry } from '~/types'

const props = defineProps<{
  workspaceId: string
  entry?: TimeEntry | null
  taskId?: string
  projectId?: string
  defaultStartTime?: string
}>()

const emit = defineEmits<{
  'saved': [entry: TimeEntry]
  'cancel': []
}>()

const { labels } = useLanguage()
const saving = ref(false)

const form = reactive({
  description: props.entry?.description || '',
  start_time: props.entry?.start_time ? props.entry.start_time.slice(0, 16) : (props.defaultStartTime || ''),
  end_time: props.entry?.end_time ? props.entry.end_time.slice(0, 16) : '',
  duration_minutes: props.entry?.duration_minutes || '',
  billable: props.entry?.billable ?? true,
})
onMounted(() => {
  if (!form.start_time) form.start_time = new Date().toISOString().slice(0, 16)
})

async function save() {
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      description: form.description || null,
      start_time: new Date(form.start_time).toISOString(),
      billable: form.billable,
      source: 'manual',
    }

    if (form.end_time) {
      body.end_time = new Date(form.end_time).toISOString()
    }
    if (form.duration_minutes) {
      body.duration_minutes = parseInt(String(form.duration_minutes))
    }
    if (props.taskId) body.task_id = props.taskId
    if (props.projectId) body.project_id = props.projectId

    let result: TimeEntry
    if (props.entry) {
      result = await $fetch<TimeEntry>(`/api/workspaces/${props.workspaceId}/time-entries/${props.entry.id}`, {
        method: 'PATCH',
        body,
      })
    } else {
      result = await $fetch<TimeEntry>(`/api/workspaces/${props.workspaceId}/time-entries`, {
        method: 'POST',
        body,
      })
    }

    emit('saved', result)
  } catch (err) {
    console.error('[TimeEntryForm] save error:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form @submit.prevent="save" class="space-y-3">
    <div>
      <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.description }}</label>
      <input
        v-model="form.description"
        type="text"
        class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-focusflow-500"
        :placeholder="labels.description"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.startTime }}</label>
        <input
          v-model="form.start_time"
          type="datetime-local"
          class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-focusflow-500"
        />
      </div>
      <div>
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.endTime }}</label>
        <input
          v-model="form.end_time"
          type="datetime-local"
          class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-focusflow-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.durationMinutes }}</label>
        <input
          v-model="form.duration_minutes"
          type="number"
          min="1"
          class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-focusflow-500"
        />
      </div>
      <div class="flex items-end pb-2">
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input v-model="form.billable" type="checkbox" class="rounded border-gray-300 text-focusflow-500 focus:ring-focusflow-500" />
          {{ labels.billable }}
        </label>
      </div>
    </div>

    <div class="flex gap-2 pt-2">
      <button
        type="submit"
        :disabled="saving"
        class="px-4 py-2 text-sm font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600 disabled:opacity-50"
      >
        {{ saving ? labels.loading : labels.save }}
      </button>
      <button
        type="button"
        @click="emit('cancel')"
        class="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {{ labels.cancel }}
      </button>
    </div>
  </form>
</template>
