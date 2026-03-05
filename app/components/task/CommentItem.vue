<script setup lang="ts">
import type { TaskComment } from '~/types'

const props = defineProps<{
  comment: TaskComment
  members: { id: string; email?: string; display_name?: string }[]
  currentUserId: string
  isAdmin: boolean
}>()

const emit = defineEmits<{
  'edit': [comment: TaskComment]
  'delete': [commentId: string]
  'toggle-resolved': [commentId: string, resolved: boolean]
}>()

const { labels } = useLanguage()

const authorName = computed(() => {
  const member = props.members.find(m => m.id === props.comment.user_id)
  return member?.display_name || member?.email?.split('@')[0] || 'Unknown'
})

const authorInitial = computed(() => authorName.value[0]?.toUpperCase() || '?')

const canModify = computed(() => props.comment.user_id === props.currentUserId || props.isAdmin)

const mounted = ref(false)
onMounted(() => { mounted.value = true })

const timeAgo = computed(() => {
  if (!mounted.value) return ''
  const diff = Date.now() - new Date(props.comment.created_at).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return labels.value.now
  if (mins < 60) return `${mins}${labels.value.minutesAgo}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}${labels.value.hoursAgo}`
  const days = Math.floor(hours / 24)
  return `${days}${labels.value.daysAgo}`
})

const assigneeName = computed(() => {
  if (!props.comment.assignee_id) return null
  const member = props.members.find(m => m.id === props.comment.assignee_id)
  return member?.display_name || member?.email?.split('@')[0] || 'Unknown'
})
</script>

<template>
  <div
    class="group flex gap-3 py-3"
    :class="{ 'opacity-60': comment.resolved }"
  >
    <span class="w-8 h-8 rounded-full bg-focusflow-500 text-white flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
      {{ authorInitial }}
    </span>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 text-sm">
        <span class="font-medium text-gray-900 dark:text-white">{{ authorName }}</span>
        <span class="text-gray-400 text-xs">{{ timeAgo }}</span>
        <span v-if="comment.edited_at" class="text-gray-400 text-xs italic">{{ labels.commentEdited }}</span>
        <span v-if="comment.is_action_item" class="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {{ labels.actionItem }}
        </span>
        <span v-if="comment.resolved" class="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {{ labels.resolved }}
        </span>
      </div>

      <div class="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        <MentionRenderer :content="comment.content" :members="members" />
      </div>

      <div v-if="assigneeName" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ labels.assignTo }}: {{ assigneeName }}
      </div>

      <!-- Actions -->
      <div class="mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          v-if="comment.is_action_item"
          @click="emit('toggle-resolved', comment.id, !comment.resolved)"
          class="text-xs text-gray-500 hover:text-focusflow-600 dark:text-gray-400"
        >
          {{ comment.resolved ? labels.markUnresolved : labels.markResolved }}
        </button>
        <button
          v-if="canModify"
          @click="emit('edit', comment)"
          class="text-xs text-gray-500 hover:text-focusflow-600 dark:text-gray-400"
        >
          {{ labels.editComment }}
        </button>
        <button
          v-if="canModify"
          @click="emit('delete', comment.id)"
          class="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400"
        >
          {{ labels.delete }}
        </button>
      </div>
    </div>
  </div>
</template>
