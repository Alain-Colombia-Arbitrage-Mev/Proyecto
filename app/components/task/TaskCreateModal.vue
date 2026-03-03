<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6 max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1b1b1b]">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{{ t.newTask }}</h2>
        <p class="text-sm text-gray-500 dark:text-[#99a0ae] mb-5">{{ t.addToBoard }}</p>

        <form class="space-y-4" @submit.prevent="handleCreate">
          <UFormField :label="t.title">
            <UInput v-model="form.title" :placeholder="t.whatToDo" required class="w-full" size="lg" autofocus />
          </UFormField>

          <UFormField :label="t.description">
            <LazyTaskEditor
              v-model="form.description"
              :workspace-id="workspaceId"
              :placeholder="t.describeTask"
              min-height="100px"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="t.priority">
              <USelectMenu v-model="form.priority" :items="priorityOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField :label="t.dueDate">
              <UInput v-model="form.due_date" type="date" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="t.column">
              <USelectMenu v-model="form.column_id" :items="columnOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField :label="t.estimation">
              <UInput v-model="form.estimated_hours" type="number" step="0.5" :placeholder="t.optional" class="w-full" />
            </UFormField>
          </div>

          <UFormField :label="t.assigned">
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in workspaceMembers"
                :key="m.user_id"
                type="button"
                class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border"
                :class="form.assignees.includes(m.user_id)
                  ? 'bg-focusflow-50 dark:bg-focusflow-950 text-focusflow-700 dark:text-focusflow-300 border-focusflow-200'
                  : 'bg-white dark:bg-white/5 text-gray-500 dark:text-[#99a0ae] border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'"
                @click="toggleAssignee(m.user_id)"
              >
                <div class="w-4 h-4 rounded-full bg-focusflow-100 dark:bg-focusflow-950 text-focusflow-700 dark:text-focusflow-300 flex items-center justify-center text-[7px] font-bold">
                  {{ getInitials(m.email) }}
                </div>
                {{ m.email.split('@')[0] }}
              </button>
            </div>
          </UFormField>

          <!-- Figma Links -->
          <TaskFigmaLinks v-model="form.figma_links" />

          <UFormField :label="t.tagsSeparated">
            <UInput v-model="form.tagsStr" :placeholder="t.tagPlaceholder" class="w-full" />
          </UFormField>

          <p v-if="error" class="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/30 rounded-lg px-3 py-2">{{ error }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <UButton variant="ghost" @click="isOpen = false">{{ t.cancel }}</UButton>
            <UButton type="submit" color="primary" :loading="creating" class="font-semibold">{{ t.create }}</UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FigmaLink } from '~/types'

const props = defineProps<{
  open: boolean
  workspaceId: string
  projectId: string
  columnId: string
  workspaceMembers: { user_id: string; email: string; role: string }[]
  columns: { id: string; title: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const lang = useLanguage()
const t = lang.labels

const creating = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
  column_id: '',
  estimated_hours: '',
  assignees: [] as string[],
  figma_links: [] as FigmaLink[],
  tagsStr: '',
})

const priorityOptions = computed(() => [
  { label: t.value.priorityLow, value: 'low' },
  { label: t.value.priorityMedium, value: 'medium' },
  { label: t.value.priorityHigh, value: 'high' },
  { label: t.value.priorityCritical, value: 'critical' },
])

const columnOptions = computed(() =>
  props.columns.map(c => ({ label: c.title, value: c.id }))
)

watch(() => props.open, (val) => {
  if (val) {
    Object.assign(form, {
      title: '', description: '', priority: 'medium', due_date: '',
      column_id: props.columnId, estimated_hours: '', assignees: [],
      figma_links: [], tagsStr: '',
    })
    error.value = ''
  }
})


function toggleAssignee(userId: string) {
  const idx = form.assignees.indexOf(userId)
  if (idx !== -1) form.assignees.splice(idx, 1)
  else form.assignees.push(userId)
}

function getInitials(email: string) {
  if (email.includes('@')) return email.split('@')[0]!.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

async function handleCreate() {
  if (!form.title.trim()) return
  error.value = ''
  creating.value = true
  try {
    const tags = form.tagsStr ? form.tagsStr.split(',').map(s => s.trim()).filter(Boolean) : []
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks`, {
      method: 'POST',
      body: {
        project_id: props.projectId,
        column_id: form.column_id || null,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        tags,
        assignees: form.assignees,
        figma_links: form.figma_links,
      },
    })
    isOpen.value = false
    emit('created')
  } catch (e: any) {
    error.value = e.data?.message || t.value.errorCreating
  } finally {
    creating.value = false
  }
}
</script>
