<script setup lang="ts">
import type { Goal } from '~/types'

const props = defineProps<{
  goal: Goal
}>()

const emit = defineEmits<{
  'edit': [goal: Goal]
  'click': [goal: Goal]
}>()

const { labels, localizedTitle, localizedDescription } = useLanguage()

const percent = computed(() => {
  if (!props.goal.target_value || props.goal.target_value === 0) return 0
  return Math.min(100, Math.round((props.goal.current_value / props.goal.target_value) * 100))
})

const statusColor = computed(() => {
  switch (props.goal.status) {
    case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'cancelled': return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
    default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
})

const typeIcon = computed(() => {
  switch (props.goal.goal_type) {
    case 'objective': return 'i-heroicons-flag'
    case 'key_result': return 'i-heroicons-chart-bar'
    default: return 'i-heroicons-trophy'
  }
})
</script>

<template>
  <div
    @click="emit('click', goal)"
    class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-focusflow-300 dark:hover:border-focusflow-700 cursor-pointer transition-colors"
  >
    <div class="flex items-start justify-between mb-2">
      <div class="flex items-center gap-2">
        <UIcon :name="typeIcon" class="w-4 h-4 text-gray-400" />
        <span class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ localizedTitle(goal) }}
        </span>
      </div>
      <span class="px-1.5 py-0.5 rounded text-xs font-medium" :class="statusColor">
        {{ goal.status === 'completed' ? labels.goalCompleted : goal.status === 'cancelled' ? labels.goalCancelled : labels.goalActive }}
      </span>
    </div>

    <p v-if="goal.description" class="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
      {{ localizedDescription(goal) }}
    </p>

    <!-- Progress -->
    <div v-if="goal.target_value" class="mt-2">
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="text-gray-500 dark:text-gray-400">{{ labels.progress }}</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ goal.current_value }} / {{ goal.target_value }} {{ goal.unit }}
        </span>
      </div>
      <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-focusflow-500 rounded-full transition-all duration-300"
          :style="{ width: `${percent}%` }"
        />
      </div>
    </div>

    <div v-if="goal.period_end" class="mt-2 text-xs text-gray-400">
      {{ labels.deadline }}: {{ new Date(goal.period_end).toLocaleDateString() }}
    </div>
  </div>
</template>
