<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div
        class="flex flex-col bg-white dark:bg-[#1b1b1b] rounded-xl max-h-[85vh] w-[92vw] sm:w-[520px] mx-auto relative overflow-hidden"
        @dragover.prevent="onDragOver"
        @dragleave.self="dragOver = false"
        @drop.prevent="handleDrop"
      >
        <!-- Full-modal drag overlay -->
        <div
          v-if="dragOver"
          class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-focusflow-50/95 dark:bg-focusflow-950/95 backdrop-blur-sm border-2 border-dashed border-focusflow-400 rounded-xl"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @dragleave.prevent="dragOver = false"
        >
          <div class="w-14 h-14 rounded-2xl bg-focusflow-100 dark:bg-focusflow-900 flex items-center justify-center mb-3 animate-bounce">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-7 h-7 text-focusflow-600" />
          </div>
          <p class="text-sm font-semibold text-focusflow-700 dark:text-focusflow-300">{{ t.dropFileHere }}</p>
          <p class="text-xs text-focusflow-500 mt-1">.csv, .txt</p>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-200/80 dark:border-white/10 shrink-0">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-focusflow-600" />
            <h2 class="text-base font-bold text-gray-900 dark:text-gray-100">{{ t.importTasks }}</h2>
          </div>
          <button class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" @click="isOpen = false">
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          <!-- Platform badges -->
          <div>
            <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{{ t.compatiblePlatforms }}</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="p in platforms" :key="p" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">{{ p }}</span>
            </div>
          </div>

          <!-- Column selector -->
          <div>
            <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">{{ t.targetColumn }}</label>
            <USelectMenu v-model="selectedColumnId" :items="columnOptions" value-key="value" class="w-full" size="sm" :placeholder="t.firstColumn" />
          </div>

          <!-- Map columns toggle -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="mapColumns" type="checkbox" class="rounded border-gray-300 dark:border-white/20 text-focusflow-600 focus:ring-focusflow-500 dark:bg-white/10" />
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ t.mapColumnsLabel }}</span>
          </label>

          <!-- Drop zone / CSV input -->
          <div>
            <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">{{ t.pasteOrUpload }}</label>

            <!-- Empty state: prominent drop zone -->
            <div v-if="!csvText">
              <div
                class="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer hover:border-focusflow-300 hover:bg-focusflow-50/50 dark:hover:bg-focusflow-950/30 border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5"
                @click="fileInputEl?.click()"
              >
                <div class="w-10 h-10 rounded-xl bg-focusflow-50 dark:bg-focusflow-900/50 flex items-center justify-center mb-2">
                  <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-focusflow-500" />
                </div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ t.dragDropCsv }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ t.orClickBrowse }}</p>
              </div>
              <input ref="fileInputRef" type="file" accept=".csv,.txt" class="hidden" @change="handleFileUpload" />

              <div class="flex items-center gap-2 my-2">
                <div class="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                <span class="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">{{ t.orPasteBelow }}</span>
                <div class="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              </div>

              <textarea
                v-model="csvText"
                rows="3"
                class="w-full bg-gray-50 dark:bg-white/5 text-xs text-gray-700 dark:text-gray-200 font-mono resize-none outline-none border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-focusflow-400 focus:ring-1 focus:ring-focusflow-400 transition-colors"
                placeholder="Nombre,Prioridad,Fecha límite&#10;Mi tarea,Alta,Mañana"
              />
            </div>

            <!-- Loaded state: file chip + editable textarea -->
            <div v-else class="space-y-2">
              <div v-if="loadedFileName" class="flex items-center gap-2 bg-focusflow-50 dark:bg-focusflow-950/40 border border-focusflow-200 dark:border-focusflow-800/40 rounded-lg px-3 py-1.5">
                <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-focusflow-500 shrink-0" />
                <span class="text-xs font-medium text-focusflow-700 dark:text-focusflow-300 truncate">{{ loadedFileName }}</span>
                <span class="text-[10px] text-focusflow-500 ml-auto shrink-0">{{ lineCount }} {{ t.rowsDetected }}</span>
                <button class="ml-1 p-0.5 rounded hover:bg-focusflow-100 dark:hover:bg-focusflow-900 transition-colors" @click="clearCsv">
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5 text-focusflow-400" />
                </button>
              </div>

              <div class="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-gray-50/50 dark:bg-white/5">
                <textarea
                  v-model="csvText"
                  rows="4"
                  class="w-full bg-transparent text-xs text-gray-700 dark:text-gray-200 font-mono resize-none outline-none px-3 py-2"
                />
                <div class="flex items-center justify-between px-3 py-1 bg-gray-100/50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10">
                  <label class="inline-flex items-center gap-1 text-[10px] text-focusflow-600 font-medium cursor-pointer hover:underline">
                    <UIcon name="i-heroicons-arrow-path" class="w-3 h-3" />
                    {{ t.replaceFile }}
                    <input type="file" accept=".csv,.txt" class="hidden" @change="handleFileUpload" />
                  </label>
                  <button class="text-[10px] text-gray-400 hover:text-red-500 transition-colors" @click="clearCsv">{{ t.clear || 'Limpiar' }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="preview" class="rounded-lg border border-gray-200/80 dark:border-white/10 overflow-hidden">
            <div class="bg-gray-50 dark:bg-white/5 px-3 py-1.5 flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 text-emerald-500" />
              <span class="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                {{ preview.tasks.length }} {{ t.tasks }}
                <span v-if="preview.platform !== 'generic'" class="text-focusflow-600 ml-1">({{ preview.platform }})</span>
              </span>
            </div>
            <div class="max-h-32 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
              <div v-for="(task, i) in preview.tasks.slice(0, 8)" :key="i" class="px-3 py-1.5 flex items-center gap-2">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="{
                    'bg-red-500': task.priority === 'critical',
                    'bg-orange-400': task.priority === 'high',
                    'bg-blue-400': task.priority === 'medium',
                    'bg-gray-300': task.priority === 'low',
                  }"
                />
                <span class="text-xs text-gray-700 dark:text-gray-200 truncate">{{ task.title }}</span>
              </div>
              <div v-if="preview.tasks.length > 8" class="px-3 py-1.5 text-[10px] text-gray-400 text-center">
                +{{ preview.tasks.length - 8 }} {{ t.moreTasks }}
              </div>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/30 rounded-lg px-3 py-2">{{ error }}</p>

          <!-- Success -->
          <div v-if="importResult" class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 rounded-lg px-3 py-2">
            <p class="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{{ importResult.imported }} {{ t.tasksImported }}</p>
            <p v-if="importResult.platform !== 'generic'" class="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">{{ t.formatDetected }} {{ importResult.platform }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200/80 dark:border-white/10 shrink-0">
          <UButton variant="ghost" size="sm" @click="isOpen = false">{{ t.close }}</UButton>
          <UButton
            color="primary"
            size="sm"
            :loading="importing"
            :disabled="!csvText.trim() || !!importResult"
            class="font-semibold"
            @click="handleImport"
          >
            <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 mr-1" />
            {{ t.import }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const lang = useLanguage()
const t = lang.labels

const props = defineProps<{
  open: boolean
  workspaceId: string
  projectId: string
  columns: { id: string; title: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  imported: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

// Template ref for file input (Vue 3 Composition API)
const fileInputRef = ref<HTMLInputElement | null>(null)

const platforms = computed(() => ['Linear', 'Jira', 'Trello', 'ClickUp (EN/ES)', t.value.genericCsv])
const csvText = ref('')
const selectedColumnId = ref('')
const mapColumns = ref(true)
const importing = ref(false)
const error = ref('')
const dragOver = ref(false)
const importResult = ref<{ imported: number; platform: string } | null>(null)
const loadedFileName = ref('')

// Computed to expose fileInputRef to template
const fileInputEl = computed(() => fileInputRef.value)

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const columnOptions = computed(() =>
  props.columns.map(c => ({ label: c.title, value: c.id }))
)

const lineCount = computed(() => {
  if (!csvText.value.trim()) return 0
  return csvText.value.trim().split('\n').length - 1
})

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

const preview = computed(() => {
  if (!csvText.value.trim()) return null
  const lines = csvText.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return null

  const headers = parseCsvLine(lines[0]!).map(h => h.toLowerCase().replace(/^"|"$/g, ''))
  const headersNorm = headers.map(stripAccents)

  const hasH = (name: string) => headers.includes(name) || headersNorm.includes(stripAccents(name))
  const findH = (...names: string[]) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h === name || stripAccents(h) === stripAccents(name))
      if (idx !== -1) return idx
    }
    return -1
  }

  const titleIdx = findH('title', 'name', 'task', 'task name', 'summary', 'card name', 'nombre', 'nombre de tarea', 'tarea')
  const priorityIdx = findH('priority', 'prioridad')
  const tagsIdx = findH('tags', 'labels', 'etiquetas')

  if (titleIdx === -1) return null

  let platform = 'generic'
  if (hasH('estimate') && hasH('cycle number')) platform = 'linear'
  else if (hasH('issue key') && hasH('summary')) platform = 'jira'
  else if ((hasH('card name') || hasH('card id')) && hasH('list')) platform = 'trello'
  else if (hasH('task name') && hasH('estimated time')) platform = 'clickup'
  else if (hasH('nombre') && (hasH('persona asignada') || hasH('fecha límite') || hasH('fecha limite'))) platform = 'clickup_es'

  const tasks = lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = parseCsvLine(line)
    const rawPri = priorityIdx >= 0 ? (cols[priorityIdx] || '').toLowerCase() : ''
    let priority = rawPri || 'medium'
    if (['urgente', 'crítica', 'critica'].includes(priority)) priority = 'critical'
    else if (priority === 'alta') priority = 'high'
    else if (priority === 'media') priority = 'medium'
    else if (priority === 'baja') priority = 'low'
    return {
      title: (cols[titleIdx] || '').replace(/^"|"$/g, ''),
      priority,
      tags: tagsIdx >= 0 ? (cols[tagsIdx] || '').split(/[,;]/).map(t => t.trim()).filter(Boolean) : [],
    }
  }).filter(t => t.title)

  return { platform, tasks }
})

function readCsvFile(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    csvText.value = (reader.result as string).replace(/^\uFEFF/, '')
    error.value = ''
    importResult.value = null
    loadedFileName.value = file.name
  }
  reader.readAsText(file, 'UTF-8')
}

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) readCsvFile(file)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function handleDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) readCsvFile(file)
}

function clearCsv() {
  csvText.value = ''
  loadedFileName.value = ''
  error.value = ''
  importResult.value = null
}

async function handleImport() {
  if (!csvText.value.trim()) return
  importing.value = true
  error.value = ''
  importResult.value = null

  try {
    const res = await $fetch<{ platform: string; imported: number }>(`/api/workspaces/${props.workspaceId}/import/tasks`, {
      method: 'POST',
      body: {
        csv: csvText.value,
        project_id: props.projectId,
        column_id: selectedColumnId.value || null,
        map_columns: mapColumns.value,
      },
    })
    importResult.value = { imported: res.imported, platform: res.platform }
    emit('imported')
  } catch (e: any) {
    error.value = e.data?.message || e.message || t.value.errorImporting
  } finally {
    importing.value = false
  }
}

watch(isOpen, (v) => {
  if (v) {
    clearCsv()
    importing.value = false
    selectedColumnId.value = ''
  }
})
</script>
