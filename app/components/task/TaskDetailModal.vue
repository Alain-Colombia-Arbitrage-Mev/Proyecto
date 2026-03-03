<template>
  <UModal v-model:open="isOpen" class="sm:max-w-4xl w-full">
    <template #content>
      <div v-if="task" class="flex flex-col max-h-[85vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="{
                'bg-red-500 animate-pulse-dot': task.priority === 'critical',
                'bg-orange-400': task.priority === 'high',
                'bg-blue-400': task.priority === 'medium',
                'bg-gray-300': task.priority === 'low',
              }"
            />
            <h2 v-if="!editingTitle" class="text-lg font-bold text-gray-900 truncate cursor-pointer hover:text-focusflow-700" @click="editingTitle = true">
              {{ language === 'en' ? (editForm.title_en || editForm.title || task.title) : (editForm.title || task.title) }}
            </h2>
            <input
              v-else
              v-model="editForm.title"
              class="text-lg font-bold text-gray-900 w-full outline-none border-b-2 border-focusflow-400 bg-transparent"
              @blur="editingTitle = false"
              @keydown.enter="editingTitle = false"
              autofocus
            />
          </div>
          <div class="flex items-center gap-1 ml-2">
            <button
              v-if="pomodoro.activeTask.value?.id === task.id"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 tabular-nums"
              @click="pomodoro.togglePomodoro()"
              title="Pomodoro en progreso"
            >
              <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
              {{ pomodoro.display.value }}
            </button>
            <UButton
              v-else
              variant="ghost"
              size="xs"
              icon="i-heroicons-clock"
              color="neutral"
              @click="pomodoro.startForTask({ id: task.id, title: task.title }, workspaceId)"
              :title="lang.labels.value.startPomodoro"
            />
            <UButton variant="ghost" size="xs" icon="i-heroicons-sparkles" color="primary" @click="$emit('improveWithAI')" :title="lang.labels.value.improveWithAI" />
            <UButton variant="ghost" size="xs" icon="i-heroicons-trash" color="error" @click="handleDelete" :title="lang.labels.value.deleteTask" />
            <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="isOpen = false" />
          </div>
        </div>

        <!-- Body: Two-panel layout -->
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col md:flex-row">
            <!-- Left panel (~65%) -->
            <div class="flex-1 px-6 py-5 space-y-6 md:border-r border-gray-100 min-w-0">
              <!-- Description -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ lang.labels.value.description }}</h4>
                  <div class="flex items-center bg-gray-100 rounded-md p-0.5">
                    <button
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                      :class="descLang === 'es' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'"
                      @click="descLang = 'es'"
                    ><span class="text-xs">🇪🇸</span>ES</button>
                    <button
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                      :class="descLang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'"
                      @click="descLang = 'en'"
                    ><span class="text-xs">🇺🇸</span>EN</button>
                  </div>
                </div>
                <LazyTaskEditor
                  v-if="descLang === 'es'"
                  v-model="editForm.description"
                  :workspace-id="workspaceId"
                  :placeholder="lang.labels.value.addDescription"
                  min-height="150px"
                />
                <LazyTaskEditor
                  v-else
                  v-model="editForm.description_en"
                  :workspace-id="workspaceId"
                  placeholder="Add a detailed description..."
                  min-height="150px"
                />
                <p v-if="descLang === 'en' && !editForm.description_en" class="text-[10px] text-amber-500 mt-1">{{ lang.labels.value.noTranslation }}</p>
              </div>

              <!-- Attachments -->
              <TaskAttachments :task-id="task.id" :workspace-id="workspaceId" />

              <!-- Figma Links -->
              <TaskFigmaLinks v-model="editForm.figma_links" />
            </div>

            <!-- Right panel / sidebar (~35%) -->
            <div class="w-full md:w-72 lg:w-80 bg-gray-50/50 px-5 py-5 space-y-5 shrink-0">
              <!-- Status / Column -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.column }}</label>
                <USelectMenu v-model="editForm.column_id" :items="columnOptions" value-key="value" class="w-full" size="sm" />
              </div>

              <!-- Priority -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.priority }}</label>
                <USelectMenu v-model="editForm.priority" :items="priorityOptions" value-key="value" class="w-full" size="sm" />
              </div>

              <!-- Labels -->
              <TaskLabelPicker
                :workspace-id="workspaceId"
                :task-id="task.id"
                :selected-label-ids="selectedLabelIds"
                @labels-changed="handleLabelsChanged"
              />

              <!-- Assignees -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.assigned }}</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="m in workspaceMembers"
                    :key="m.user_id"
                    type="button"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border"
                    :class="editForm.assignees.includes(m.user_id)
                      ? 'bg-focusflow-50 text-focusflow-700 border-focusflow-200'
                      : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'"
                    @click="toggleAssignee(m.user_id)"
                  >
                    <div class="w-4 h-4 rounded-full bg-focusflow-100 text-focusflow-700 flex items-center justify-center text-[7px] font-bold">
                      {{ getInitials(m.email) }}
                    </div>
                    {{ m.email.split('@')[0] }}
                  </button>
                </div>
              </div>

              <!-- Due date -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.dueDate }}</label>
                <UInput v-model="editForm.due_date" type="date" class="w-full" size="sm" />
              </div>

              <!-- Estimated hours -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.estimation }}</label>
                <UInput v-model="editForm.estimated_hours" type="number" step="0.5" :placeholder="lang.labels.value.noEstimate" class="w-full" size="sm" />
              </div>

              <!-- Tags -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.tags }}</label>
                <UInput v-model="editForm.tagsStr" placeholder="bug, frontend..." class="w-full" size="sm" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-100">
          <UButton variant="ghost" @click="isOpen = false">{{ lang.labels.value.close }}</UButton>
          <UButton color="primary" :loading="saving" class="font-semibold" @click="handleSave">{{ lang.labels.value.save }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Task, FigmaLink, Label } from '~/types'
import { plainTextToHtml } from '~/utils/richtext'

const pomodoro = usePomodoroTimer()
const lang = useLanguage()
const { language } = lang
const descLang = ref<'es' | 'en'>('es')

const props = defineProps<{
  open: boolean
  task: Task | null
  workspaceId: string
  projectId: string
  workspaceMembers: { user_id: string; email: string; role: string }[]
  columns: { id: string; title: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  updated: []
  deleted: []
  improveWithAI: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const saving = ref(false)
const editingTitle = ref(false)
const selectedLabelIds = ref<string[]>([])

const editForm = reactive({
  title: '',
  title_en: '',
  description: '',
  description_en: '',
  priority: '',
  column_id: '',
  due_date: '',
  estimated_hours: '',
  tagsStr: '',
  assignees: [] as string[],
  figma_links: [] as FigmaLink[],
})

const priorityOptions = computed(() => [
  { label: lang.labels.value.priorityLow, value: 'low' },
  { label: lang.labels.value.priorityMedium, value: 'medium' },
  { label: lang.labels.value.priorityHigh, value: 'high' },
  { label: lang.labels.value.priorityCritical, value: 'critical' },
])

const columnOptions = computed(() =>
  props.columns.map(c => ({ label: c.title, value: c.id }))
)

watch(() => props.task, (t) => {
  if (!t) return
  const desc = t.description ? plainTextToHtml(t.description) : ''
  const descEn = t.description_en ? plainTextToHtml(t.description_en) : ''
  Object.assign(editForm, {
    title: t.title,
    title_en: t.title_en || '',
    description: desc,
    description_en: descEn,
    priority: t.priority,
    column_id: t.column_id || '',
    due_date: t.due_date ? t.due_date.split('T')[0] : '',
    estimated_hours: t.estimated_hours?.toString() || '',
    tagsStr: (t.tags || []).join(', '),
    assignees: [...(t.assignees || [])],
    figma_links: [...(t.figma_links || [])],
  })
  selectedLabelIds.value = (t.labels || []).map(l => l.id)
  editingTitle.value = false
  descLang.value = 'es'
}, { immediate: true })

// Auto-suggest estimated hours when deadline is set and no estimate exists
watch(() => editForm.due_date, (newDate) => {
  if (!newDate || editForm.estimated_hours) return
  const daysUntilDue = Math.max(1, Math.ceil((new Date(newDate).getTime() - Date.now()) / 86400000))
  const suggested = Math.min(daysUntilDue * 2, 40)
  editForm.estimated_hours = String(Math.round(suggested * 2) / 2)
})

function toggleAssignee(userId: string) {
  const idx = editForm.assignees.indexOf(userId)
  if (idx !== -1) editForm.assignees.splice(idx, 1)
  else editForm.assignees.push(userId)
}

function getInitials(email: string) {
  if (email.includes('@')) return email.split('@')[0]!.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function handleLabelsChanged(labels: Label[]) {
  selectedLabelIds.value = labels.map(l => l.id)
}

async function handleSave() {
  if (!props.task) return
  saving.value = true
  try {
    const tags = editForm.tagsStr ? editForm.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.task.id}`, {
      method: 'PATCH',
      body: {
        title: editForm.title,
        title_en: editForm.title_en || null,
        description: editForm.description || null,
        description_en: editForm.description_en || null,
        priority: editForm.priority,
        column_id: editForm.column_id || null,
        due_date: editForm.due_date || null,
        estimated_hours: editForm.estimated_hours ? parseFloat(editForm.estimated_hours) : null,
        tags,
        assignees: editForm.assignees,
        figma_links: editForm.figma_links,
      },
    })
    isOpen.value = false
    emit('updated')
  } catch { /* */ } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!props.task) return
  if (!confirm(lang.labels.value.deleteConfirm)) return
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.task.id}`, { method: 'DELETE' })
    isOpen.value = false
    emit('deleted')
  } catch { /* */ }
}
</script>
