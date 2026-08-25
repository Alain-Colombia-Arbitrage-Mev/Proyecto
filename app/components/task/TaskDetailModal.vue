<template>
  <UModal v-model:open="isOpen" class="sm:max-w-4xl w-full">
    <template #content>
      <div v-if="task" class="flex flex-col max-h-[85vh] bg-white dark:bg-[#1b1b1b]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200/80 dark:border-white/10">
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
              {{ language === 'ur' ? (editForm.title_ur || editForm.title_en || editForm.title || task.title) : language === 'en' ? (editForm.title_en || editForm.title || task.title) : (editForm.title || task.title) }}
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
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-bolt"
              color="warning"
              @click="pomodoro.startHyperfocus({ id: task.id, title: task.title }, workspaceId)"
              :title="language === 'en' ? 'Hyperfocus Mode (50/10 + music)' : 'Modo Hiperenfoque (50/10 + música)'"
            />
            <UButton variant="ghost" size="xs" icon="i-heroicons-sparkles" color="primary" @click="$emit('improveWithAI')" :title="lang.labels.value.improveWithAI" />
            <UButton variant="ghost" size="xs" icon="i-heroicons-cpu-chip" color="secondary" @click="showDelegateModal = true" :title="language === 'en' ? 'Delegate to AI Agent' : 'Delegar a Agente AI'" />
            <UButton variant="ghost" size="xs" icon="i-heroicons-trash" color="error" @click="handleDelete" :title="lang.labels.value.deleteTask" />
            <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="isOpen = false" />
          </div>
        </div>

        <!-- Body: Two-panel layout -->
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col md:flex-row">
            <!-- Left panel (~65%) -->
            <div class="flex-1 px-6 py-5 space-y-6 md:border-r border-gray-200/80 dark:border-white/10 min-w-0">
              <!-- Description -->
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ lang.labels.value.description }}</h4>
                  <div class="flex flex-wrap items-center justify-end gap-2">
                    <UButton
                      size="xs"
                      variant="soft"
                      color="primary"
                      icon="i-heroicons-language"
                      :loading="translatingTask"
                      :disabled="saving || !editForm.title.trim()"
                      @click="handleTranslateTask"
                    >
                      {{ language === 'en' ? 'Translate EN/UR' : 'Traducir EN/UR' }}
                    </UButton>
                    <div class="flex items-center bg-gray-100 dark:bg-white/10 rounded-md p-0.5">
                      <button
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                        :class="descLang === 'es' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 dark:text-gray-400'"
                        @click="descLang = 'es'"
                      >
                        <svg class="w-3.5 h-2.5 rounded-[1px]" viewBox="0 0 640 480"><rect width="640" height="480" fill="#c60b1e"/><rect width="640" height="240" y="120" fill="#ffc400"/></svg>
                        ES
                      </button>
                      <button
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                        :class="descLang === 'en' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 dark:text-gray-400'"
                        @click="descLang = 'en'"
                      >
                        <svg class="w-3.5 h-2.5 rounded-[1px]" viewBox="0 0 640 480"><rect width="640" height="480" fill="#fff"/><g fill="#b22234"><rect width="640" height="37"/><rect width="640" height="37" y="74"/><rect width="640" height="37" y="148"/><rect width="640" height="37" y="222"/><rect width="640" height="37" y="296"/><rect width="640" height="37" y="370"/><rect width="640" height="37" y="444"/></g><rect width="256" height="259" fill="#3c3b6e"/></svg>
                        EN
                      </button>
                      <button
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5"
                        :class="descLang === 'ur' ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-400 dark:text-gray-400'"
                        @click="descLang = 'ur'"
                      >
                        <svg class="w-3.5 h-2.5 rounded-[1px]" viewBox="0 0 640 480"><rect width="640" height="480" fill="#01411c"/><rect width="160" height="480" fill="#fff"/></svg>
                        UR
                      </button>
                    </div>
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
                  v-else-if="descLang === 'en'"
                  v-model="editForm.description_en"
                  :workspace-id="workspaceId"
                  placeholder="Add a detailed description..."
                  min-height="150px"
                />
                <LazyTaskEditor
                  v-else-if="descLang === 'ur'"
                  v-model="editForm.description_ur"
                  :workspace-id="workspaceId"
                  placeholder="...تفصیلی وضاحت شامل کریں"
                  min-height="150px"
                  dir="rtl"
                />
                <p v-if="descLang === 'en' && !editForm.description_en" class="text-[10px] text-amber-500 mt-1">{{ lang.labels.value.noTranslation }}</p>
                <p v-if="descLang === 'ur' && !editForm.description_ur" class="text-[10px] text-amber-500 mt-1">{{ lang.labels.value.noTranslation }}</p>
                <p v-if="translationActionMessage" class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">{{ translationActionMessage }}</p>
                <p v-if="translationActionError" class="text-[10px] text-red-500 mt-1">{{ translationActionError }}</p>
              </div>

              <!-- Deliverables -->
              <section class="rounded-lg border border-gray-200/80 bg-gray-50/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-2.5">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-focusflow-50 text-focusflow-600 ring-1 ring-focusflow-100 dark:bg-focusflow-500/10 dark:text-focusflow-300 dark:ring-focusflow-500/20">
                      <UIcon name="i-heroicons-archive-box" class="h-4 w-4" />
                    </div>
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white">
                      {{ language === 'en' ? 'Deliverables' : 'Entregables' }}
                    </h3>
                  </div>
                  <div class="hidden shrink-0 items-center gap-1.5 sm:flex">
                    <span class="rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 ring-1 ring-gray-200/80 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/10">
                      {{ language === 'en' ? 'Tasks' : 'Tareas' }}
                    </span>
                    <span class="rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 ring-1 ring-gray-200/80 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/10">
                      {{ language === 'en' ? 'Files' : 'Archivos' }}
                    </span>
                    <span class="rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 ring-1 ring-gray-200/80 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/10">
                      {{ language === 'en' ? 'Links' : 'Enlaces' }}
                    </span>
                  </div>
                </div>

                <div class="space-y-4">
                  <SubtaskList
                    :task-id="task.id"
                    :workspace-id="workspaceId"
                    :parent-depth="task.depth || 0"
                    :title="language === 'en' ? 'Checklist' : 'Checklist'"
                  />

                  <div class="grid gap-4 lg:grid-cols-2">
                    <TaskAttachments :task-id="task.id" :workspace-id="workspaceId" />
                    <TaskFigmaLinks v-model="editForm.figma_links" :title="language === 'en' ? 'Links' : 'Enlaces'" />
                  </div>
                </div>
              </section>

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
            </div>

            <!-- Right panel / sidebar (~35%) -->
            <div class="w-full md:w-72 lg:w-80 bg-gray-50/50 dark:bg-white/5 px-5 py-5 space-y-5 shrink-0">
              <!-- Status / Column -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.column }}</label>
                <USelectMenu v-model="editForm.column_id" :items="columnOptions" value-key="value" class="w-full" size="sm" />
              </div>

              <!-- Priority -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.priority }}</label>
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
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.assigned }}</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="m in workspaceMembers"
                    :key="m.user_id"
                    type="button"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border"
                    :class="editForm.assignees.includes(m.user_id)
                      ? 'bg-focusflow-50 dark:bg-focusflow-950 text-focusflow-700 dark:text-focusflow-300 border-focusflow-200'
                      : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/80 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'"
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
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.dueDate }}</label>
                <UInput v-model="editForm.due_date" type="date" class="w-full" size="sm" />
              </div>

              <!-- Estimated hours -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.estimation }}</label>
                <UInput v-model="editForm.estimated_hours" type="number" step="0.5" :placeholder="lang.labels.value.noEstimate" class="w-full" size="sm" />
              </div>

              <!-- Card Color -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ language === 'en' ? 'Card Color' : 'Color de tarjeta' }}</label>
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

              <!-- AI Agent -->
              <div v-if="task?.ai_agent">
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ language === 'en' ? 'AI Agent' : 'Agente AI' }}</label>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                    <UIcon name="i-heroicons-cpu-chip" class="w-3 h-3" />
                    {{ task.ai_agent }}
                  </span>
                  <button class="text-[10px] text-gray-400 hover:text-red-500 cursor-pointer" @click="clearAgent">
                    {{ language === 'en' ? 'Clear' : 'Quitar' }}
                  </button>
                </div>
              </div>

              <!-- Tags -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.tags }}</label>
                <UInput v-model="editForm.tagsStr" placeholder="bug, frontend..." class="w-full" size="sm" />
              </div>

              <!-- Time tracking -->
              <div>
                <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">{{ lang.labels.value.timeTracking }}</label>
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
        <div class="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200/80 dark:border-white/10">
          <UButton variant="ghost" @click="isOpen = false">{{ lang.labels.value.close }}</UButton>
          <UButton color="primary" :loading="saving" class="font-semibold" @click="handleSave">{{ lang.labels.value.save }}</UButton>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Delegate to AI Agent Modal -->
  <LazyTaskDelegateAgentModal
    v-if="task"
    v-model:open="showDelegateModal"
    :task-id="task.id"
    :task-title="task.title"
    :workspace-id="workspaceId"
    :project-id="projectId"
    @delegated="emit('updated')"
  />
</template>

<script setup lang="ts">
import type { Task, FigmaLink, Label } from '~/types'
import { plainTextToHtml } from '~/utils/richtext'

const pomodoro = usePomodoroTimer()
const timeTracker = useTimeTracker()
const lang = useLanguage()
const { language } = lang
const descLang = ref<'es' | 'en' | 'ur'>('es')

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
const translatingTask = ref(false)
const translationActionMessage = ref('')
const translationActionError = ref('')
const editingTitle = ref(false)
const selectedLabelIds = ref<string[]>([])
const showDelegateModal = ref(false)

const editForm = reactive({
  title: '',
  title_en: '',
  title_ur: '',
  description: '',
  description_en: '',
  description_ur: '',
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

function populateForm(t: Task) {
  const desc = t.description ? plainTextToHtml(t.description) : ''
  const descEn = t.description_en ? plainTextToHtml(t.description_en) : ''
  const descUr = t.translations?.ur?.description ? plainTextToHtml(t.translations.ur.description) : ''
  Object.assign(editForm, {
    title: t.title,
    title_en: t.title_en || '',
    title_ur: t.translations?.ur?.title || '',
    description: desc,
    description_en: descEn,
    description_ur: descUr,
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
}

let translationRefetchTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.task, (t) => {
  if (!t) return
  populateForm(t)
  editingTitle.value = false
  descLang.value = 'es'
  translationActionMessage.value = ''
  translationActionError.value = ''

  // If translations are missing, refetch after a delay to pick up fire-and-forget translations
  if (translationRefetchTimer) clearTimeout(translationRefetchTimer)
  if (!t.title_en && t.title) {
    translationRefetchTimer = setTimeout(async () => {
      try {
        const res = await $fetch<{ task: Task }>(`/api/workspaces/${props.workspaceId}/tasks/${t.id}`)
        const fresh = res.task
        if (fresh.title_en || fresh.translations?.ur?.title || fresh.translations?.ur?.description) {
          editForm.title_en = fresh.title_en || ''
          editForm.title_ur = fresh.translations?.ur?.title || ''
          editForm.description_en = fresh.description_en ? plainTextToHtml(fresh.description_en) : ''
          editForm.description_ur = fresh.translations?.ur?.description ? plainTextToHtml(fresh.translations.ur.description) : ''
        }
      } catch { /* ignore */ }
    }, 4000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (translationRefetchTimer) clearTimeout(translationRefetchTimer)
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

function buildUpdatePayload(skipAutoTranslate = false) {
  const tags = editForm.tagsStr ? editForm.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
  return {
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
    translations: editForm.title_ur || editForm.description_ur ? { ur: { title: editForm.title_ur || null, description: editForm.description_ur || null } } : undefined,
    skip_auto_translate: skipAutoTranslate,
  }
}

async function persistTaskEdits(skipAutoTranslate = false) {
  if (!props.task) return null
  return await $fetch<Task>(`/api/workspaces/${props.workspaceId}/tasks/${props.task.id}`, {
    method: 'PATCH',
    body: buildUpdatePayload(skipAutoTranslate),
  })
}

function applyTranslatedTask(fresh: Task) {
  editForm.title_en = fresh.title_en || ''
  editForm.title_ur = fresh.translations?.ur?.title || ''
  editForm.description_en = fresh.description_en ? plainTextToHtml(fresh.description_en) : ''
  editForm.description_ur = fresh.translations?.ur?.description ? plainTextToHtml(fresh.translations.ur.description) : ''
  descLang.value = language.value === 'ur' ? 'ur' : 'en'
}

async function handleTranslateTask() {
  if (!props.task || translatingTask.value) return
  translatingTask.value = true
  translationActionMessage.value = ''
  translationActionError.value = ''
  try {
    await persistTaskEdits(true)
    const result = await $fetch<{ ok: boolean; task: Task }>(`/api/workspaces/${props.workspaceId}/tasks/${props.task.id}/translate`, {
      method: 'POST',
      body: {
        title: editForm.title,
        description: editForm.description || null,
      },
    })
    applyTranslatedTask(result.task)
    translationActionMessage.value = language.value === 'en'
      ? 'English and Urdu translations updated.'
      : 'Traducciones en inglés y urdu actualizadas.'
    emit('updated')
  } catch (e: any) {
    translationActionError.value = e.data?.message || e.message || (language.value === 'en' ? 'Translation failed' : 'No se pudo traducir')
  } finally {
    translatingTask.value = false
  }
}

async function handleSave() {
  if (!props.task) return
  saving.value = true
  try {
    await persistTaskEdits(false)
    isOpen.value = false
    emit('updated')
  } catch { /* */ } finally {
    saving.value = false
  }
}

async function clearAgent() {
  if (!props.task) return
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.task.id}`, {
      method: 'PATCH',
      body: { ai_agent: null },
    })
    emit('updated')
  } catch {}
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
