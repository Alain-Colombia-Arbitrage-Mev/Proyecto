<template>
  <div class="grid w-full gap-4" :class="props.class || 'auto-rows-[22rem] grid-cols-3'">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  class?: string
}>()
</script>
