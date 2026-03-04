<script setup lang="ts">
import type { Goal, GoalType } from '~/types'

const props = defineProps<{
  workspaceId: string
  parentGoalId?: string
}>()

const emit = defineEmits<{
  'created': [goal: Goal]
  'close': []
}>()

const { labels } = useLanguage()
const saving = ref(false)

const form = reactive({
  title: '',
  title_en: '',
  description: '',
  goal_type: 'goal' as GoalType,
  target_value: 100,
  unit: '%',
  period_start: '',
  period_end: '',
})

const goalTypes: { value: GoalType; label: string }[] = [
  { value: 'goal', label: 'Goal' },
  { value: 'objective', label: 'Objective' },
  { value: 'key_result', label: 'Key Result' },
]

async function create() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      title: form.title,
      goal_type: form.goal_type,
      target_value: form.target_value,
      unit: form.unit,
    }
    if (form.title_en) body.title_en = form.title_en
    if (form.description) body.description = form.description
    if (form.period_start) body.period_start = form.period_start
    if (form.period_end) body.period_end = form.period_end
    if (props.parentGoalId) body.parent_goal_id = props.parentGoalId

    const goal = await $fetch<Goal>(`/api/workspaces/${props.workspaceId}/goals`, {
      method: 'POST',
      body,
    })
    emit('created', goal)
  } catch (err) {
    console.error('[GoalCreateModal] error:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ labels.createGoal }}</h2>

      <form @submit.prevent="create" class="space-y-4">
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.title }} *</label>
          <input v-model="form.title" type="text" required autofocus
            class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-focusflow-500" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.goal }} type</label>
            <select v-model="form.goal_type" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
              <option v-for="gt in goalTypes" :key="gt.value" :value="gt.value">{{ gt.label }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.unit }}</label>
            <input v-model="form.unit" type="text" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" />
          </div>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.targetValue }}</label>
          <input v-model.number="form.target_value" type="number" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.startDate }}</label>
            <input v-model="form.period_start" type="date" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.endDate }}</label>
            <input v-model="form.period_end" type="date" class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" />
          </div>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ labels.description }}</label>
          <textarea v-model="form.description" rows="2"
            class="mt-1 w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-focusflow-500" />
        </div>

        <div class="flex gap-2 pt-2">
          <button type="submit" :disabled="!form.title.trim() || saving"
            class="px-4 py-2 text-sm font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600 disabled:opacity-50">
            {{ saving ? labels.loading : labels.create }}
          </button>
          <button type="button" @click="emit('close')"
            class="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            {{ labels.cancel }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
