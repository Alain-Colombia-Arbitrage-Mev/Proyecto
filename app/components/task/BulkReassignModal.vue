<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
  members: { id: string; email?: string; display_name?: string }[]
  projectId?: string
}>()

const emit = defineEmits<{
  'close': []
  'reassigned': [count: number]
}>()

const { labels } = useLanguage()
const fromUserId = ref('')
const toUserId = ref('')
const reason = ref('')
const loading = ref(false)
const result = ref<number | null>(null)

const availableTargets = computed(() => props.members.filter(m => m.id !== fromUserId.value))

async function reassign() {
  if (!fromUserId.value || !toUserId.value) return
  loading.value = true
  try {
    const data = await $fetch<{ count: number }>(`/api/workspaces/${props.workspaceId}/tasks/bulk-reassign`, {
      method: 'POST',
      body: {
        from_user_id: fromUserId.value,
        to_user_id: toUserId.value,
        project_id: props.projectId || undefined,
        reason: reason.value || undefined,
      },
    })
    result.value = data.count
    emit('reassigned', data.count)
  } catch (err) {
    console.error('[BulkReassignModal] error:', err)
  } finally {
    loading.value = false
  }
}

function getMemberName(id: string) {
  const m = props.members.find(m => m.id === id)
  return m?.display_name || m?.email || id
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ labels.bulkReassign }}</h2>

      <div v-if="result !== null" class="text-center py-6">
        <div class="text-3xl font-bold text-focusflow-600 mb-2">{{ result }}</div>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ labels.tasksReassigned }}</p>
        <button @click="emit('close')" class="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600">
          {{ labels.close }}
        </button>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.reassignFrom }}</label>
          <select v-model="fromUserId" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
            <option value="">{{ labels.selectAll }}...</option>
            <option v-for="m in members" :key="m.id" :value="m.id">{{ m.display_name || m.email }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.reassignTo }}</label>
          <select v-model="toUserId" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
            <option value="">{{ labels.selectAll }}...</option>
            <option v-for="m in availableTargets" :key="m.id" :value="m.id">{{ m.display_name || m.email }}</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.reassignReason }}</label>
          <input v-model="reason" type="text" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            @click="reassign"
            :disabled="!fromUserId || !toUserId || loading"
            class="px-4 py-2 text-sm font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600 disabled:opacity-50"
          >
            {{ loading ? labels.loading : labels.reassign }}
          </button>
          <button @click="emit('close')" class="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            {{ labels.cancel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
