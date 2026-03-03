<template>
  <UModal v-model:open="isOpen" class="sm:max-w-lg w-full">
    <template #content>
      <div class="flex flex-col bg-white dark:bg-[#1b1b1b]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-focusflow-600" />
            <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ t.importTasks }}</h2>
          </div>
          <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-4">
          <!-- Platform badges -->
          <div>
            <p class="text-xs font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide mb-2">{{ t.compatiblePlatforms }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="p in platforms" :key="p" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-[#99a0ae]">{{ p }}</span>
            </div>
          </div>

          <!-- Column selector -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ t.targetColumn }}</label>
            <USelectMenu v-model="selectedColumnId" :items="columnOptions" value-key="value" class="w-full" size="sm" :placeholder="t.firstColumn" />
          </div>

          <!-- Map columns toggle -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="mapColumns" type="checkbox" class="rounded border-gray-300 dark:border-white/20 text-focusflow-600 focus:ring-focusflow-500 dark:bg-white/10" />
            <span class="text-sm text-gray-700 dark:text-[#99a0ae]">{{ t.mapColumnsLabel }}</span>
          </label>

          <!-- CSV input -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">{{ t.pasteOrUpload }}</label>
            <div
              class="relative border-2 border-dashed rounded-xl transition-colors p-4"
              :class="dragOver ? 'border-focusflow-400 bg-focusflow-50 dark:bg-focusflow-950' : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5'"
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="handleDrop"
            >
              <textarea
                v-model="csvText"
                rows="6"
                class="w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 font-mono resize-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="title,priority,description,tags&#10;Implementar login,high,Login con OAuth,auth,frontend&#10;..."
              />
              <div class="flex items-center justify-between mt-2">
                <label class="inline-flex items-center gap-1.5 text-xs text-focusflow-600 font-medium cursor-pointer hover:underline">
                  <UIcon name="i-heroicons-document-arrow-up" class="w-3.5 h-3.5" />
                  {{ t.uploadCsv }}
                  <input type="file" accept=".csv,.txt" class="hidden" @change="handleFileUpload" />
                </label>
                <span v-if="csvText" class="text-[10px] text-gray-400">{{ lineCount }} {{ t.rowsDetected }}</span>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="preview" class="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
            <div class="bg-gray-50 dark:bg-white/5 px-4 py-2 flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-600 dark:text-[#99a0ae]">
                {{ t.preview }} {{ preview.tasks.length }} {{ t.tasks }}
                <span v-if="preview.platform !== 'generic'" class="text-focusflow-600">({{ preview.platform }})</span>
              </span>
            </div>
            <div class="max-h-40 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
              <div v-for="(task, i) in preview.tasks.slice(0, 10)" :key="i" class="px-4 py-2 flex items-center gap-2">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="{
                    'bg-red-500': task.priority === 'critical',
                    'bg-orange-400': task.priority === 'high',
                    'bg-blue-400': task.priority === 'medium',
                    'bg-gray-300': task.priority === 'low',
                  }"
                />
                <span class="text-sm text-gray-800 dark:text-gray-200 truncate">{{ task.title }}</span>
                <span v-for="tag in task.tags.slice(0, 2)" :key="tag" class="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-[#99a0ae]">{{ tag }}</span>
              </div>
              <div v-if="preview.tasks.length > 10" class="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 text-center">
                +{{ preview.tasks.length - 10 }} {{ t.moreTasks }}
              </div>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/30 rounded-lg px-3 py-2">{{ error }}</p>

          <!-- Success -->
          <div v-if="importResult" class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 rounded-lg px-4 py-3">
            <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{{ importResult.imported }} {{ t.tasksImported }}</p>
            <p v-if="importResult.platform !== 'generic'" class="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">{{ t.formatDetected }} {{ importResult.platform }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-100 dark:border-white/10">
          <UButton variant="ghost" @click="isOpen = false">{{ t.close }}</UButton>
          <UButton
            color="primary"
            :loading="importing"
            :disabled="!csvText.trim() || !!importResult"
            class="font-semibold"
            @click="handleImport"
          >
            <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 mr-1" />
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

const platforms = computed(() => ['Linear', 'Jira', 'Trello', 'ClickUp', t.value.genericCsv])
const csvText = ref('')
const selectedColumnId = ref('')
const mapColumns = ref(true)
const importing = ref(false)
const error = ref('')
const dragOver = ref(false)
const importResult = ref<{ imported: number; platform: string } | null>(null)

const columnOptions = computed(() =>
  props.columns.map(c => ({ label: c.title, value: c.id }))
)

const lineCount = computed(() => {
  if (!csvText.value.trim()) return 0
  return csvText.value.trim().split('\n').length - 1 // minus header
})

// Client-side preview using simple parsing
const preview = computed(() => {
  if (!csvText.value.trim()) return null
  const lines = csvText.value.trim().split('\n')
  if (lines.length < 2) return null

  const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase())
  const titleIdx = headers.findIndex(h => ['title', 'name', 'task', 'task name', 'summary', 'card name'].includes(h))
  const priorityIdx = headers.findIndex(h => h === 'priority')
  const tagsIdx = headers.findIndex(h => ['tags', 'labels'].includes(h))

  if (titleIdx === -1) return null

  // Detect platform
  let platform = 'generic'
  const hs = new Set(headers)
  if (hs.has('estimate') && hs.has('cycle number')) platform = 'linear'
  else if (hs.has('issue key') && hs.has('summary')) platform = 'jira'
  else if ((hs.has('card name') || hs.has('card id')) && hs.has('list')) platform = 'trello'
  else if (hs.has('task name') && hs.has('estimated time')) platform = 'clickup'

  const tasks = lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = line.split(',').map(c => c.trim())
    return {
      title: cols[titleIdx] || '',
      priority: (priorityIdx >= 0 ? cols[priorityIdx]?.toLowerCase() : 'medium') || 'medium',
      tags: tagsIdx >= 0 ? (cols[tagsIdx] || '').split(';').map(t => t.trim()).filter(Boolean) : [],
    }
  }).filter(t => t.title)

  return { platform, tasks }
})

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    csvText.value = reader.result as string
    error.value = ''
    importResult.value = null
  }
  reader.readAsText(file)
}

function handleDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    csvText.value = reader.result as string
    error.value = ''
    importResult.value = null
  }
  reader.readAsText(file)
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

// Reset state when modal opens
watch(isOpen, (v) => {
  if (v) {
    csvText.value = ''
    error.value = ''
    importResult.value = null
    importing.value = false
    selectedColumnId.value = ''
  }
})
</script>
