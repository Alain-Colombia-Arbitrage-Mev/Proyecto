<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
  parentTaskId: string
}>()

const emit = defineEmits<{
  'created': [task: unknown]
}>()

const { labels } = useLanguage()
const title = ref('')
const creating = ref(false)
const showForm = ref(false)

async function create() {
  if (!title.value.trim() || creating.value) return
  creating.value = true

  try {
    const task = await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.parentTaskId}/subtasks`, {
      method: 'POST',
      body: { title: title.value.trim() },
    })
    emit('created', task)
    title.value = ''
    showForm.value = false
  } catch (err) {
    console.error('[SubtaskCreateInline] error:', err)
  } finally {
    creating.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    create()
  } else if (e.key === 'Escape') {
    showForm.value = false
    title.value = ''
  }
}
</script>

<template>
  <div>
    <button
      v-if="!showForm"
      @click="showForm = true"
      class="flex items-center gap-1.5 text-xs text-gray-500 hover:text-focusflow-600 dark:text-gray-400 dark:hover:text-focusflow-400 py-1"
    >
      <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
      {{ labels.addSubtask }}
    </button>

    <div v-else class="flex items-center gap-2">
      <input
        v-model="title"
        @keydown="onKeydown"
        :placeholder="labels.subtaskTitle"
        class="flex-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-focusflow-500"
        autofocus
      />
      <button
        @click="create"
        :disabled="!title.trim() || creating"
        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600 disabled:opacity-50"
      >
        {{ creating ? '...' : labels.save }}
      </button>
      <button
        @click="showForm = false; title = ''"
        class="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
      >
        {{ labels.cancel }}
      </button>
    </div>
  </div>
</template>
