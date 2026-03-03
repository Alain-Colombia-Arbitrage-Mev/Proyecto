<template>
  <button
    class="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
    :class="sidebarStyle
      ? 'text-white/40 hover:text-white/80 hover:bg-white/[0.08]'
      : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
    @click="darkMode.toggle()"
    :title="isDark ? 'Light mode' : 'Dark mode'"
  >
    <UIcon v-if="isDark" name="i-heroicons-sun" class="w-4 h-4" />
    <UIcon v-else name="i-heroicons-moon" class="w-4 h-4" />
  </button>
</template>

<script setup lang="ts">
defineProps<{ sidebarStyle?: boolean }>()
const darkMode = useDarkMode()
const isDark = darkMode.isDark
</script>
