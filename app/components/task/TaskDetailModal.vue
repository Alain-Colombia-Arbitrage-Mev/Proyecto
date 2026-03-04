<template>
  <UModal v-model:open="isOpen" class="sm:max-w-4xl w-full">
    <template #content>
      <div v-if="task" class="flex flex-col max-h-[85vh] bg-white dark:bg-[#1b1b1b]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
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
            <h2 v-if="!editingTitle" class="text-lg font-bold text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-focusflow-700 dark:hover:text-focusflow-300" @click="editingTitle = true">
              {{ language === 'en' ? (editForm.title_en || editForm.title || task.title) : (editForm.title || task.title) }}
            </h2>
            <input
              v-else
              v-model="editForm.title"
              class="text-lg font-bold text-gray-900 dark:text-gray-100 w-full outline-none border-b-2 border-focusflow-400 bg-transparent"
              @blur="editingTitle = false"
              @keydown.enter="editingTitle = false"
              autofocus
            />
          </div>
          <div class="flex items-center gap-1 ml-2">
            <button
              v-if="pomodoro.activeTask.value?.id === task.id"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 tabular-nums"
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
            <div class="flex-1 px-6 py-5 space-y-6 md:border-r border-gray-100 dark:border-white/10 min-w-0">
              <!-- Description -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide">{{ lang.labels.value.description }}</h4>
                  <div class="flex items-center bg-gray-100 dark:bg-white/10 rounded-md p-0.5">
                    <button
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                      :class="descLang === 'es' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 dark:text-[#99a0ae]'"
                      @click="descLang = 'es'"
                    >
                      <svg class="w-3.5 h-2.5 rounded-[1px]" viewBox="0 0 640 480"><rect width="640" height="480" fill="#c60b1e"/><rect width="640" height="240" y="120" fill="#ffc400"/></svg>
                      ES
                    </button>
                    <button
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                      :class="descLang === 'en' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 dark:text-[#99a0ae]'"
                      @click="descLang = 'en'"
                    >
                      <svg class="w-3.5 h-2.5 rounded-[1px]" viewBox="0 0 640 480"><rect width="640" height="480" fill="#fff"/><g fill="#b22234"><rect width="640" height="37"/><rect width="640" height="37" y="74"/><rect width="640" height="37" y="148"/><rect width="640" height="37" y="222"/><rect width="640" height="37" y="296"/><rect width="640" height="37" y="370"/><rect width="640" height="37" y="444"/></g><rect width="256" height="259" fill="#3c3b6e"/></svg>
                      EN
                    </button>
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

              <!-- Subtasks -->
              <SubtaskList
                :task-id="task.id"
                :workspace-id="workspaceId"
                :parent-depth="task.depth || 0"
              />

              <!-- Comments -->
              <TaskComments
                :task-id="task.id"
                :workspace-id="workspaceId"
                :members="workspaceMembers.map(m => ({ id: m.user_id, email: m.email }))"
              />

              <!-- Relationships -->
              <TaskRelationships
                :task-id="task.id"
                :workspace-id="workspaceId"
              />

              <!-- Attachments -->
              <TaskAttachments :task-id="task.id" :workspace-id="workspaceId" />

              <!-- Figma Links -->
              <TaskFigmaLinks v-model="editForm.figma_links" />
            </div>

            <!-- Right panel / sidebar (~35%) -->
            <div class="w-full md:w-72 lg:w-80 bg-gray-50/50 dark:bg-white/5 px-5 py-5 space-y-5 shrink-0">
              <!-- Status / Column -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ lang.labels.value.column }}</label>
                <USelectMenu v-model="editForm.column_id" :items="columnOptions" value-key="value" class="w-full" size="sm" />
              </div>

              <!-- Priority -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ lang.labels.value.priority }}</label>
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
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ lang.labels.value.assigned }}</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="m in workspaceMembers"
                    :key="m.user_id"
                    type="button"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border"
                    :class="editForm.assignees.includes(m.user_id)
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
              </div>

              <!-- Due date -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ lang.labels.value.dueDate }}</label>
                <UInput v-model="editForm.due_date" type="date" class="w-full" size="sm" />
              </div>

              <!-- Estimated hours -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ lang.labels.value.estimation }}</label>
                <UInput v-model="editForm.estimated_hours" type="number" step="0.5" :placeholder="lang.labels.value.noEstimate" class="w-full" size="sm" />
              </div>

              <!-- Card Color -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ language === 'en' ? 'Card Color' : 'Color de tarjeta' }}</label>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    class="w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center"
                    :class="!editForm.color ? 'border-gray-400 dark:border-white/40 scale-110' : 'border-transparent hover:scale-105'"
                    @click="editForm.color = ''"
                    :title="language === 'en' ? 'No color' : 'Sin color'"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    v-for="c in cardColors"
                    :key="c"
                    type="button"
                    class="w-6 h-6 rounded-full border-2 transition-all cursor-pointer"
                    :class="editForm.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'"
                    :style="{ backgroundColor: c }"
                    @click="editForm.color = c"
                  />
                </div>
              </div>

              <!-- Tags -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ lang.labels.value.tags }}</label>
                <UInput v-model="editForm.tagsStr" placeholder="bug, frontend..." class="w-full" size="sm" />
              </div>

              <!-- Time tracking -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ lang.labels.value.timeTracking }}</label>
                <button
                  v-if="!timeTracker.isRunning.value || timeTracker.activeTaskId.value !== task.id"
                  @click="timeTracker.startTimer({ workspaceId, taskId: task.id, taskTitle: task.title, projectId })"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-focusflow-50 dark:bg-focusflow-950/30 text-focusflow-700 dark:text-focusflow-400 hover:bg-focusflow-100 dark:hover:bg-focusflow-900/30 transition-colors"
                >
                  <UIcon name="i-heroicons-play" class="w-3.5 h-3.5" />
                  {{ lang.labels.value.startTimer }}
                </button>
                <div v-else class="flex items-center gap-2 text-xs">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span class="font-mono font-bold text-gray-900 dark:text-white">{{ timeTracker.elapsedDisplay.value }}</span>
                  <button @click="timeTracker.stopTimer()" class="text-red-500 hover:text-red-600 ml-1">
                    <UIcon name="i-heroicons-stop" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-100 dark:border-white/10">
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
const timeTracker = useTimeTracker()
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
  color: '',
})

const cardColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#F97316', '#EF4444', '#EC4899', '#14B8A6', '#6366F1', '#84CC16']

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
    color: (t as any).color || '',
  })
  selectedLabelIds.value = (t.labels || []).map(l => l.id)
  editingTitle.value = false
  descLang.value = 'es'
}, { immediate: true })


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
        color: editForm.color || null,
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
  } catch { /* */ }
  isOpen.value = false
  emit('deleted')
}
</script>
