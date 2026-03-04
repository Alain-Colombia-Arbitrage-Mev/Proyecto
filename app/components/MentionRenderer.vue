<script setup lang="ts">
/**
 * Renders @mentions as styled chips within text content.
 * Replaces @[userId] patterns with user display names.
 */
const props = defineProps<{
  content: string
  members: { id: string; email?: string; display_name?: string }[]
}>()

const segments = computed(() => {
  const mentionRegex = /@\[([a-f0-9-]+)\]/g
  const result: { type: 'text' | 'mention'; value: string; userId?: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(props.content)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: props.content.slice(lastIndex, match.index) })
    }
    const userId = match[1]
    const member = props.members.find(m => m.id === userId)
    const name = member?.display_name || member?.email?.split('@')[0] || 'Unknown'
    result.push({ type: 'mention', value: name, userId })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < props.content.length) {
    result.push({ type: 'text', value: props.content.slice(lastIndex) })
  }

  return result
})
</script>

<template>
  <span>
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="seg.type === 'text'">{{ seg.value }}</span>
      <span
        v-else
        class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-focusflow-100 text-focusflow-700 dark:bg-focusflow-900/30 dark:text-focusflow-400"
      >
        @{{ seg.value }}
      </span>
    </template>
  </span>
</template>
