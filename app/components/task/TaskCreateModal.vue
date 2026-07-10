<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6 max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1b1b1b]">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{{ t.newTask }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">{{ t.addToBoard }}</p>

        <!-- Draft restored banner -->
        <div v-if="draftRestored" class="flex items-center justify-between gap-2 px-3 py-2 mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-medium">
          <span>{{ language === 'en' ? 'Draft restored' : 'Borrador restaurado' }}</span>
          <button type="button" class="underline hover:no-underline" @click="discardDraft">
            {{ language === 'en' ? 'Discard' : 'Descartar' }}
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleCreate">
          <UFormField :label="t.title">
            <div class="flex gap-2">
              <UInput v-model="form.title" :placeholder="t.whatToDo" required class="flex-1" size="lg" autofocus />
              <UButton
                icon="i-heroicons-sparkles"
                color="primary"
                variant="soft"
                size="lg"
                :loading="aiAssisting"
                :disabled="!form.title.trim()"
                :title="language === 'en' ? 'AI Assistant: completes description, priority, estimation and tags from your idea' : 'Asistente AI: completa descripción, prioridad, estimación y tags desde tu idea'"
                @click="aiAssist"
              />
            </div>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              {{ language === 'en' ? 'Write a rough idea and tap ✨ — the AI assistant completes the task for you (attached docs are used as context)' : 'Escribe una idea y toca ✨ — el asistente AI completa la tarea por ti (los documentos adjuntos se usan como contexto)' }}
            </p>
            <div class="mt-2">
              <DocAttach v-model="aiDocs" :label="language === 'en' ? 'Context docs for AI' : 'Docs de contexto para AI'" />
            </div>
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
                  : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/80 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'"
                @click="toggleAssignee(m.user_id)"
              >
                <div class="w-4 h-4 rounded-full bg-focusflow-100 dark:bg-focusflow-950 text-focusflow-700 dark:text-focusflow-300 flex items-center justify-center text-[7px] font-bold">
                  {{ getInitials(m.email) }}
                </div>
                {{ m.email.split('@')[0] }}
              </button>
            </div>
          </UFormField>

          <!-- Delegate to AI agent by specialty -->
          <UFormField :label="language === 'en' ? 'Delegate to AI Agent' : 'Delegar a Agente AI'">
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="agent in AI_AGENTS"
                :key="agent.type"
                type="button"
                class="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border"
                :class="form.ai_agent === agent.type
                  ? 'text-gray-900 dark:text-white border-transparent'
                  : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/80 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'"
                :style="form.ai_agent === agent.type ? { backgroundColor: agent.color + '2e', borderColor: agent.color + '66' } : {}"
                :title="language === 'en' ? agent.specialtyEn : agent.specialty"
                @click="form.ai_agent = form.ai_agent === agent.type ? '' : agent.type"
              >
                <span>{{ agent.emoji }}</span>
                {{ language === 'en' ? agent.nameEn : agent.name }}
              </button>
            </div>
            <p v-if="selectedAgent" class="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
              {{ language === 'en' ? selectedAgent.specialtyEn : selectedAgent.specialty }}
            </p>
          </UFormField>

          <!-- Card Color -->
          <UFormField :label="language === 'en' ? 'Card Color' : 'Color de tarjeta'">
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                class="w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center"
                :class="!form.color ? 'border-gray-400 dark:border-white/40 scale-110' : 'border-transparent hover:scale-105'"
                @click="form.color = ''"
                :title="language === 'en' ? 'No color' : 'Sin color'"
              >
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-gray-400" />
              </button>
              <button
                v-for="c in cardColors"
                :key="c"
                type="button"
                class="w-6 h-6 rounded-full border-2 transition-all cursor-pointer"
                :class="form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'"
                :style="{ backgroundColor: c }"
                @click="form.color = c"
              />
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
const { language } = lang
const t = lang.labels

const cardColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#F97316', '#EF4444', '#EC4899', '#14B8A6', '#6366F1', '#84CC16']

const creating = ref(false)
const error = ref('')
const aiAssisting = ref(false)
const aiDocs = ref<{ name: string; content: string }[]>([])
const draftRestored = ref(false)
const justCreated = ref(false)

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
  column_id: '',
  estimated_hours: '',
  assignees: [] as string[],
  figma_links: [] as FigmaLink[],
  color: '',
  tagsStr: '',
  ai_agent: '',
})

const selectedAgent = computed(() => AI_AGENTS.find(a => a.type === form.ai_agent) || null)

const priorityOptions = computed(() => [
  { label: t.value.priorityLow, value: 'low' },
  { label: t.value.priorityMedium, value: 'medium' },
  { label: t.value.priorityHigh, value: 'high' },
  { label: t.value.priorityCritical, value: 'critical' },
])

const columnOptions = computed(() =>
  props.columns.map(c => ({ label: c.title, value: c.id }))
)

// --- Draft persistence ---
const draftKey = computed(() => `focusflow_task_draft_${props.projectId}`)

function hasFormData(): boolean {
  return !!(form.title.trim() || form.description.trim() || form.due_date
    || form.estimated_hours || form.assignees.length || form.tagsStr.trim()
    || form.color || form.figma_links.length || form.priority !== 'medium'
    || form.ai_agent)
}

function saveDraft() {
  if (!hasFormData()) {
    localStorage.removeItem(draftKey.value)
    return
  }
  const draft = {
    title: form.title,
    description: form.description,
    priority: form.priority,
    due_date: form.due_date,
    column_id: form.column_id,
    estimated_hours: form.estimated_hours,
    assignees: form.assignees,
    figma_links: form.figma_links,
    color: form.color,
    tagsStr: form.tagsStr,
    ai_agent: form.ai_agent,
    savedAt: Date.now(),
  }
  localStorage.setItem(draftKey.value, JSON.stringify(draft))
}

function loadDraft(): boolean {
  try {
    const raw = localStorage.getItem(draftKey.value)
    if (!raw) return false
    const draft = JSON.parse(raw)
    // Discard drafts older than 24 hours
    if (draft.savedAt && Date.now() - draft.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(draftKey.value)
      return false
    }
    Object.assign(form, {
      title: draft.title || '',
      description: draft.description || '',
      priority: draft.priority || 'medium',
      due_date: draft.due_date || '',
      column_id: draft.column_id || props.columnId,
      estimated_hours: draft.estimated_hours || '',
      assignees: draft.assignees || [],
      figma_links: draft.figma_links || [],
      color: draft.color || '',
      tagsStr: draft.tagsStr || '',
      ai_agent: draft.ai_agent || '',
    })
    return true
  } catch {
    return false
  }
}

function clearDraft() {
  localStorage.removeItem(draftKey.value)
  draftRestored.value = false
}

function discardDraft() {
  clearDraft()
  Object.assign(form, {
    title: '', description: '', priority: 'medium', due_date: '',
    column_id: props.columnId, estimated_hours: '', assignees: [],
    figma_links: [], color: '', tagsStr: '', ai_agent: '',
  })
}

// Save draft on close if form has data
watch(() => props.open, (val) => {
  if (val) {
    // Opening: try to restore draft, otherwise reset
    error.value = ''
    const restored = loadDraft()
    if (restored) {
      draftRestored.value = true
      // Update column_id to current target if draft had a different one
      if (!form.column_id) form.column_id = props.columnId
    } else {
      draftRestored.value = false
      Object.assign(form, {
        title: '', description: '', priority: 'medium', due_date: '',
        column_id: props.columnId, estimated_hours: '', assignees: [],
        figma_links: [], color: '', tagsStr: '', ai_agent: '',
      })
    }
  } else {
    // Closing: save draft only if it wasn't a successful creation
    if (justCreated.value) {
      justCreated.value = false
    } else {
      saveDraft()
    }
  }
})

// Auto-save draft as user types (debounced)
let draftTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => [form.title, form.description, form.priority, form.due_date,
    form.estimated_hours, form.color, form.tagsStr, form.assignees.length, form.figma_links.length, form.ai_agent],
  () => {
    if (!props.open) return
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(saveDraft, 500)
  },
)


// AI assistant: turn a rough idea into a complete task (improve_task action)
async function aiAssist() {
  if (!form.title.trim() || aiAssisting.value) return
  error.value = ''
  aiAssisting.value = true
  try {
    const res = await $fetch<{ type: string; data: any }>('/api/ai/assist', {
      method: 'POST',
      body: {
        action: 'improve_task',
        context: {
          taskTitle: form.title,
          taskDescription: form.description || '',
          priority: form.priority,
          workspaceId: props.workspaceId,
          documentContext: aiDocs.value.length
            ? aiDocs.value.map(f => `--- Archivo: ${f.name} ---\n${f.content}`).join('\n\n')
            : undefined,
        },
      },
    })
    const d = res?.data
    if (!d || typeof d !== 'object') throw new Error('empty')
    if (d.title) form.title = String(d.title)
    if (d.description) form.description = String(d.description)
    if (['low', 'medium', 'high', 'critical'].includes(d.priority_suggestion)) form.priority = d.priority_suggestion
    if (typeof d.estimated_hours === 'number' && d.estimated_hours > 0) form.estimated_hours = String(d.estimated_hours)
    if (Array.isArray(d.tags) && d.tags.length) form.tagsStr = d.tags.slice(0, 8).join(', ')
    // Suggest an AI agent from tags/title keywords when none is selected
    if (!form.ai_agent) {
      const text = `${form.title} ${form.tagsStr}`.toLowerCase()
      const match = AI_AGENTS.find(a =>
        text.includes(a.type) || (a.type === 'backend' && /\bapi\b|base de datos|database|endpoint/.test(text))
        || (a.type === 'frontend' && /\bui\b|componente|component|diseño de interfaz/.test(text))
        || (a.type === 'qa' && /\btest|prueba|qa\b/.test(text))
        || (a.type === 'seo' && /\bseo\b/.test(text))
        || (a.type === 'security' && /seguridad|security/.test(text)))
      if (match) form.ai_agent = match.type
    }
  } catch (e: any) {
    error.value = e.data?.message || (language.value === 'en' ? 'AI assistant unavailable' : 'Asistente AI no disponible')
  } finally {
    aiAssisting.value = false
  }
}

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
        color: form.color || null,
        ai_agent: form.ai_agent || null,
      },
    })
    clearDraft()
    Object.assign(form, {
      title: '', description: '', priority: 'medium', due_date: '',
      column_id: props.columnId, estimated_hours: '', assignees: [],
      figma_links: [], color: '', tagsStr: '', ai_agent: '',
    })
    justCreated.value = true
    isOpen.value = false
    emit('created')
  } catch (e: any) {
    error.value = e.data?.message || t.value.errorCreating
  } finally {
    creating.value = false
  }
}
</script>
