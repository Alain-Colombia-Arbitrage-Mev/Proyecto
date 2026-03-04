<script setup lang="ts">
import type { TaskComment } from '~/types'

const props = defineProps<{
  taskId: string
  workspaceId: string
  members: { id: string; email?: string; display_name?: string }[]
}>()

const { labels } = useLanguage()
const auth = useAuthStore()
const { canManageComments } = usePermissions()

const comments = ref<TaskComment[]>([])
const loading = ref(true)
const newComment = ref('')
const mentionedIds = ref<string[]>([])
const isActionItem = ref(false)
const assigneeId = ref<string | null>(null)
const editingComment = ref<TaskComment | null>(null)
const editContent = ref('')

async function fetchComments() {
  try {
    const data = await $fetch<TaskComment[]>(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/comments`)
    comments.value = data || []
  } catch (err) {
    console.error('[TaskComments] fetch error:', err)
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return

  try {
    const created = await $fetch<TaskComment>(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/comments`, {
      method: 'POST',
      body: {
        content: newComment.value,
        mentions: mentionedIds.value,
        is_action_item: isActionItem.value,
        assignee_id: assigneeId.value,
      },
    })
    comments.value.push(created)
    newComment.value = ''
    mentionedIds.value = []
    isActionItem.value = false
    assigneeId.value = null
  } catch (err) {
    console.error('[TaskComments] create error:', err)
  }
}

async function handleDelete(commentId: string) {
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/comments/${commentId}`, { method: 'DELETE' })
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) {
    console.error('[TaskComments] delete error:', err)
  }
}

async function handleToggleResolved(commentId: string, resolved: boolean) {
  try {
    const updated = await $fetch<TaskComment>(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/comments/${commentId}`, {
      method: 'PATCH',
      body: { resolved },
    })
    const idx = comments.value.findIndex(c => c.id === commentId)
    if (idx >= 0) comments.value[idx] = updated
  } catch (err) {
    console.error('[TaskComments] toggle resolved error:', err)
  }
}

function handleEdit(comment: TaskComment) {
  editingComment.value = comment
  editContent.value = comment.content
}

async function submitEdit() {
  if (!editingComment.value || !editContent.value.trim()) return

  try {
    const updated = await $fetch<TaskComment>(
      `/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/comments/${editingComment.value.id}`,
      { method: 'PATCH', body: { content: editContent.value } },
    )
    const idx = comments.value.findIndex(c => c.id === editingComment.value!.id)
    if (idx >= 0) comments.value[idx] = updated
    editingComment.value = null
    editContent.value = ''
  } catch (err) {
    console.error('[TaskComments] edit error:', err)
  }
}

function onMention(userId: string) {
  if (!mentionedIds.value.includes(userId)) {
    mentionedIds.value.push(userId)
  }
}

const isAdmin = computed(() => {
  const role = auth.role
  return ['admin', 'owner', 'superadmin'].includes(role)
})

onMounted(fetchComments)
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
      {{ labels.comments }} ({{ comments.length }})
    </h3>

    <div v-if="loading" class="text-sm text-gray-400">{{ labels.loading }}</div>

    <div v-else>
      <!-- Comment list -->
      <div v-if="comments.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
        <template v-for="comment in comments" :key="comment.id">
          <!-- Edit mode -->
          <div v-if="editingComment?.id === comment.id" class="py-3">
            <textarea
              v-model="editContent"
              class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-focusflow-500 resize-none"
              rows="3"
            />
            <div class="flex gap-2 mt-2">
              <button
                @click="submitEdit"
                class="px-3 py-1 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600"
              >
                {{ labels.save }}
              </button>
              <button
                @click="editingComment = null"
                class="px-3 py-1 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {{ labels.cancel }}
              </button>
            </div>
          </div>

          <!-- Display mode -->
          <CommentItem
            v-else
            :comment="comment"
            :members="members"
            :current-user-id="auth.user?.id || ''"
            :is-admin="isAdmin"
            @edit="handleEdit"
            @delete="handleDelete"
            @toggle-resolved="handleToggleResolved"
          />
        </template>
      </div>

      <p v-else class="text-sm text-gray-400 py-2">{{ labels.noComments }}</p>

      <!-- New comment form -->
      <div v-if="canManageComments" class="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <MentionAutocomplete
          v-model="newComment"
          :members="members"
          :placeholder="labels.writeComment"
          @mention="onMention"
        />

        <div class="flex items-center gap-3 mt-2">
          <label class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input v-model="isActionItem" type="checkbox" class="rounded border-gray-300 text-focusflow-500 focus:ring-focusflow-500" />
            {{ labels.actionItem }}
          </label>

          <select
            v-if="isActionItem"
            v-model="assigneeId"
            class="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
          >
            <option :value="null">{{ labels.assignTo }}...</option>
            <option v-for="m in members" :key="m.id" :value="m.id">
              {{ m.display_name || m.email }}
            </option>
          </select>

          <div class="flex-1" />

          <button
            @click="submitComment"
            :disabled="!newComment.trim()"
            class="px-4 py-1.5 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ labels.addComment.replace('...', '') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
