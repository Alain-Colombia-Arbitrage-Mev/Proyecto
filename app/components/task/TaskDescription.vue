<template>
  <div v-if="sanitizedHtml" class="prose prose-sm max-w-none text-gray-700" v-html="sanitizedHtml" />
  <p v-else class="text-sm text-gray-400 italic">Sin descripción</p>
</template>

<script setup lang="ts">
const props = defineProps<{
  html?: string
}>()

const sanitizedHtml = computed(() => {
  if (!props.html) return ''
  // Basic sanitization: remove script, iframe, on* event handlers
  return props.html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s*on\w+="[^"]*"/gi, '')
    .replace(/\s*on\w+='[^']*'/gi, '')
})
</script>
