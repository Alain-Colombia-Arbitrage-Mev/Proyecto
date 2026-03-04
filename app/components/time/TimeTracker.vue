<script setup lang="ts">
/**
 * Floating time tracker widget — shown in layout when timer is running.
 * Also provides a start button when not running.
 */
const props = defineProps<{
  workspaceId: string
}>()

const { labels } = useLanguage()
const { isRunning, activeTaskTitle, elapsedDisplay, stopTimer, discardTimer } = useTimeTracker()

const stopping = ref(false)

async function handleStop() {
  stopping.value = true
  await stopTimer()
  stopping.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-300 ease-in"
    enter-from-class="translate-y-4 opacity-0"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="isRunning"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900 dark:bg-gray-800 text-white shadow-2xl border border-gray-700"
    >
      <!-- Pulsing dot -->
      <span class="relative flex h-2.5 w-2.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>

      <!-- Timer display -->
      <div class="flex flex-col">
        <span class="text-lg font-mono font-bold tracking-wider">{{ elapsedDisplay }}</span>
        <span v-if="activeTaskTitle" class="text-xs text-gray-400 truncate max-w-[160px]">
          {{ activeTaskTitle }}
        </span>
      </div>

      <!-- Stop button -->
      <button
        @click="handleStop"
        :disabled="stopping"
        class="ml-2 p-2 rounded-xl bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
        :title="labels.stopTimer"
      >
        <UIcon name="i-heroicons-stop" class="w-4 h-4" />
      </button>

      <!-- Discard button -->
      <button
        @click="discardTimer"
        class="p-2 rounded-xl hover:bg-gray-700 transition-colors"
        :title="labels.cancel"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-gray-400" />
      </button>
    </div>
  </Transition>
</template>
