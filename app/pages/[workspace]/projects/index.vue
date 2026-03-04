<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-fade-up">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{{ t.projects }}</h1>
        <p class="text-sm text-gray-500 dark:text-[#99a0ae] mt-0.5">{{ store.projects.length }} {{ store.projects.length !== 1 ? t.projects.toLowerCase() : t.project.toLowerCase() }}</p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" size="md" class="font-semibold hidden sm:inline-flex" @click="showCreate = true">
        {{ t.newProject }}
      </UButton>
      <UButton icon="i-heroicons-plus" color="primary" size="md" class="sm:hidden" @click="showCreate = true" />
    </div>

    <!-- Stat Cards Row -->
    <div v-if="store.projects.length > 0" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up">
      <!-- Proyectos Totales -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{{ t.totalProjects }}</p>
        <div class="flex items-end justify-between">
          <span class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ store.projects.length }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'p'+i" class="flex-1 rounded-sm bg-emerald-200" :style="{ height: `${barHeights.projects[i - 1]}%` }" />
          </div>
        </div>
      </div>
      <!-- Tareas Totales -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{{ t.totalTasks }}</p>
        <div class="flex items-end justify-between">
          <span class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ totalTasks }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'t'+i" class="flex-1 rounded-sm bg-emerald-300" :style="{ height: `${barHeights.tasks[i - 1]}%` }" />
          </div>
        </div>
      </div>
      <!-- Vencen Hoy -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{{ t.dueToday }}</p>
        <div class="flex items-end justify-between">
          <span class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ dueTodayCount }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'d'+i" class="flex-1 rounded-sm bg-emerald-200" :style="{ height: `${barHeights.dueToday[i - 1]}%` }" />
          </div>
        </div>
      </div>
      <!-- Completadas -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{{ t.completed }}</p>
        <div class="flex items-end justify-between">
          <span class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ completedTaskCount }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'c'+i" class="flex-1 rounded-sm bg-emerald-300" :style="{ height: `${barHeights.completed[i - 1]}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div v-if="store.projects.length > 0" class="flex flex-wrap items-center justify-between gap-2 mb-6 animate-fade-up">
      <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ t.sprintBoard }}</p>
      <div class="flex items-center gap-2">
        <UButton variant="outline" size="md" icon="i-heroicons-funnel" class="text-gray-600">
          {{ t.filters }}
        </UButton>
        <UButton color="primary" size="md" icon="i-heroicons-plus" class="font-semibold" @click="showCreate = true">
          {{ t.createTask }}
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ lang.language.value === 'en' ? 'Loading projects...' : 'Cargando proyectos...' }}</span>
      </div>
    </div>

    <!-- No workspace -->
    <div v-else-if="!store.workspace" class="text-center py-20 animate-fade-up">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-5">
        <UIcon name="i-heroicons-building-office" class="w-8 h-8 text-gray-400" />
      </div>
      <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ t.workspaceNotFound }}</h2>
      <p class="text-sm text-gray-500 dark:text-[#99a0ae] mt-2 mb-6">{{ t.createWorkspaceFirst }}</p>
      <UButton color="primary" size="lg" class="font-semibold" @click="router.push('/onboarding')">{{ t.createWorkspace }}</UButton>
    </div>

    <!-- Empty state -->
    <div v-else-if="store.projects.length === 0" class="text-center py-20 animate-fade-up">
      <div class="w-20 h-20 rounded-2xl bg-focusflow-50 flex items-center justify-center mx-auto mb-5">
        <UIcon name="i-heroicons-folder-plus" class="w-10 h-10 text-focusflow-500" />
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ t.noProjects }}</h2>
      <p class="text-sm text-gray-500 dark:text-[#99a0ae] mt-2 mb-8 max-w-xs mx-auto">{{ t.noProjectsDesc }}</p>
      <UButton icon="i-heroicons-plus" color="primary" size="lg" class="font-semibold" @click="showCreate = true">{{ t.createFirstProject }}</UButton>
    </div>

    <!-- Project grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up delay-100">
      <div v-for="project in store.projects" :key="project.id" class="relative group/card">
        <NuxtLink :to="`/${store.slug}/projects/${project.id}/kanban`">
          <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-5 border border-gray-100 dark:border-white/10 hover:border-focusflow-300 transition-all duration-200 cursor-pointer group h-full shadow-sm hover:shadow-md">
            <div class="flex items-start gap-3">
              <div class="w-4 h-4 rounded-full mt-0.5 shrink-0" :style="{ backgroundColor: project.color }" />
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-focusflow-600 transition-colors">{{ project.name }}</h3>
                <p v-if="project.description" class="text-sm text-gray-500 dark:text-[#99a0ae] mt-1.5 line-clamp-2 leading-relaxed">{{ project.description }}</p>
                <div class="flex items-center gap-2 mt-3 flex-wrap">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider" :class="statusClasses(project.status)">
                    {{ statusLabel(project.status) }}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider" :class="priorityClasses(project.priority)">
                    {{ priorityLabel(project.priority) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>
        <button
          v-if="canDeleteProjects"
          class="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/90 dark:bg-[#1b1b1b]/90 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 opacity-0 group-hover/card:opacity-100 transition-all z-10"
          @click.prevent="confirmDeleteProject(project)"
          :title="t.delete"
        >
          <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{{ t.deleteConfirmProject }}</h3>
          <p class="text-sm text-gray-500 dark:text-[#99a0ae] mb-6">
            <strong>{{ projectToDelete?.name }}</strong><br/>
            {{ t.deleteProjectWarning }}
          </p>
          <div class="flex justify-center gap-3">
            <UButton variant="ghost" @click="showDeleteConfirm = false">{{ t.cancel }}</UButton>
            <UButton color="error" :loading="deleting" @click="handleDeleteProject">{{ t.delete }}</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Create project modal -->
    <UModal v-model:open="showCreate">
      <template #content>
        <div class="bg-white dark:bg-[#1b1b1b] rounded-xl max-h-[85vh] w-[92vw] sm:w-[520px] mx-auto flex flex-col overflow-hidden relative"
          @dragover.prevent="importDragOver = true"
          @dragleave.self="importDragOver = false"
          @drop.prevent="handleImportDrop"
        >
          <!-- Full-modal drag overlay -->
          <div
            v-if="importDragOver"
            class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-focusflow-50/95 dark:bg-focusflow-950/95 backdrop-blur-sm border-2 border-dashed border-focusflow-400 rounded-xl"
            @dragover.prevent
            @drop.prevent="handleImportDrop"
            @dragleave.prevent="importDragOver = false"
          >
            <div class="w-14 h-14 rounded-2xl bg-focusflow-100 dark:bg-focusflow-900 flex items-center justify-center mb-3 animate-bounce">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-7 h-7 text-focusflow-600" />
            </div>
            <p class="text-sm font-semibold text-focusflow-700 dark:text-focusflow-300">{{ t.dropFileHere }}</p>
            <p class="text-xs text-focusflow-500 mt-1">.csv, .txt</p>
          </div>

          <!-- Header -->
          <div class="px-5 pt-5 pb-3 shrink-0">
            <h2 class="text-base font-bold text-gray-900 dark:text-gray-100">{{ t.newProject }}</h2>
            <p class="text-xs text-gray-500 dark:text-[#99a0ae] mt-0.5">{{ t.configureProject }}</p>
          </div>

          <!-- Scrollable form -->
          <form class="flex-1 overflow-y-auto px-5 pb-2 space-y-4 min-h-0" @submit.prevent="handleCreateProject">
            <UFormField :label="t.projectName">
              <UInput v-model="newProject.name" :placeholder="t.projectNamePlaceholder" required class="w-full" size="md" autofocus />
            </UFormField>
            <UFormField :label="t.descriptionOptional">
              <UTextarea v-model="newProject.description" :placeholder="t.whatIsProject" class="w-full" :rows="2" />
            </UFormField>
            <UFormField :label="t.priority">
              <USelectMenu v-model="newProject.priority" :items="priorityOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField :label="t.kanbanTemplate">
              <div class="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                <button
                  v-for="tpl in templateConfigs"
                  :key="tpl.value"
                  type="button"
                  class="w-full text-left px-3 py-2 rounded-lg border transition-all cursor-pointer"
                  :class="newProject.template === tpl.value
                    ? 'border-focusflow-400 bg-focusflow-50/60 dark:bg-focusflow-950/30 shadow-sm'
                    : 'border-gray-100 dark:border-white/10 hover:border-focusflow-200 hover:bg-gray-50 dark:hover:bg-white/5'"
                  @click="newProject.template = tpl.value"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-gray-900 dark:text-gray-100">{{ tpl.label }}</span>
                    <span class="text-[9px] font-semibold text-gray-400">{{ tpl.cols }} {{ t.columns }}</span>
                  </div>
                  <div class="flex gap-1 flex-wrap">
                    <span
                      v-for="col in tpl.columns"
                      :key="col.title"
                      class="text-[9px] font-semibold px-1 py-0.5 rounded"
                      :style="{ backgroundColor: col.color + '18', color: col.color }"
                    >{{ col.title }}</span>
                  </div>
                </button>
              </div>
            </UFormField>

            <!-- CSV Import Section -->
            <div class="border-t border-gray-100 dark:border-white/10 pt-3">
              <div class="flex items-center gap-2 mb-1.5">
                <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 text-focusflow-600" />
                <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                  {{ lang.language.value === 'en' ? 'Import tasks from CSV' : 'Importar tareas desde CSV' }}
                </span>
                <span class="text-[9px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{{ t.optional }}</span>
              </div>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 mb-2">
                {{ lang.language.value === 'en' ? 'Upload a CSV from ClickUp, Jira, Trello, Linear or generic format' : 'Sube un CSV de ClickUp, Jira, Trello, Linear o formato genérico' }}
              </p>

              <!-- CSV file drop area -->
              <div v-if="!importCsv"
                class="border-2 border-dashed rounded-lg py-5 px-4 text-center transition-all cursor-pointer hover:border-focusflow-300 hover:bg-focusflow-50/50 dark:hover:bg-focusflow-950/30 border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5"
                @click="csvFileInputRef?.click()"
              >
                <div class="w-8 h-8 rounded-lg bg-focusflow-50 dark:bg-focusflow-900/50 flex items-center justify-center mx-auto mb-1.5">
                  <UIcon name="i-heroicons-document-arrow-up" class="w-4 h-4 text-focusflow-500" />
                </div>
                <p class="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {{ lang.language.value === 'en' ? 'Drop CSV file here or click to upload' : 'Arrastra un CSV aquí o haz clic para subir' }}
                </p>
                <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">ClickUp, Jira, Trello, Linear, CSV</p>
                <input ref="csvFileInputRef" type="file" accept=".csv,.txt" class="hidden" @change="handleImportFileUpload" />
              </div>

              <!-- CSV loaded preview -->
              <div v-else class="space-y-1.5">
                <div class="bg-focusflow-50 dark:bg-focusflow-950/30 border border-focusflow-200 dark:border-focusflow-800/30 rounded-lg px-3 py-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 min-w-0">
                      <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-focusflow-600 shrink-0" />
                      <span class="text-xs font-semibold text-focusflow-700 dark:text-focusflow-400">
                        {{ importPreview?.count || 0 }} {{ t.tasks }}
                      </span>
                      <span v-if="importPreview?.platform !== 'generic'" class="text-[9px] font-medium text-focusflow-500 bg-focusflow-100 dark:bg-focusflow-500/10 px-1.5 py-0.5 rounded shrink-0">
                        {{ importPreview?.platform === 'clickup_es' ? 'ClickUp (ES)' : importPreview?.platform }}
                      </span>
                    </div>
                    <button type="button" class="p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0" @click="clearImportCsv">
                      <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <!-- Suggested template badge -->
                <div v-if="importPreview?.suggestedTemplate" class="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                  <UIcon name="i-heroicons-light-bulb" class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span class="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    {{ lang.language.value === 'en' ? 'Suggested template' : 'Plantilla sugerida' }}: <strong>{{ importPreview.suggestedTemplate.label }}</strong>
                    ({{ importPreview.suggestedTemplate.matched }}/{{ importPreview.suggestedTemplate.total }} {{ lang.language.value === 'en' ? 'columns match' : 'columnas coinciden' }})
                  </span>
                </div>
              </div>
            </div>

            <p v-if="createError" class="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/30 rounded-lg px-3 py-2">{{ createError }}</p>

            <!-- Footer buttons inside form -->
            <div class="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1 pb-3 sticky bottom-0 bg-white dark:bg-[#1b1b1b]">
              <UButton variant="ghost" size="sm" type="button" @click="showCreate = false" class="w-full sm:w-auto">{{ t.cancel }}</UButton>
              <UButton type="submit" color="primary" size="sm" :loading="creating" class="font-semibold w-full sm:w-auto">
                <UIcon v-if="importCsv" name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 mr-1" />
                {{ importCsv ? (lang.language.value === 'en' ? 'Create & Import' : 'Crear e importar') : t.createProject }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const router = useRouter()
const store = useWorkspaceStore()
const lang = useLanguage()
const t = lang.labels
const auth = useAuthStore()

const canDeleteProjects = computed(() => auth.isAdmin)

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const newProject = reactive({ name: '', description: '', priority: 'medium', template: 'simple' })

// CSV import at project creation
const importCsv = ref('')
const importDragOver = ref(false)
const importPreview = ref<{ platform: string; count: number; suggestedTemplate?: { template: string; label: string; matched: number; total: number } } | null>(null)
const csvFileInputRef = ref<HTMLInputElement | null>(null)

function readImportFile(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    importCsv.value = (reader.result as string).replace(/^\uFEFF/, '')
    updateImportPreview()
  }
  reader.readAsText(file, 'UTF-8')
}

function handleImportFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) readImportFile(file)
}

function handleImportDrop(e: DragEvent) {
  importDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) readImportFile(file)
}

function parseCsvLineSimple(line: string): string[] {
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

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Client-side synonym map for template suggestion (mirrors server/utils/csvImporter.ts)
const clientSynonyms: Record<string, string[]> = {
  'pendiente': ['to do', 'todo', 'por hacer', 'pending'],
  'en progreso': ['in progress', 'doing', 'in development', 'en desarrollo', 'en proceso', 'wip'],
  'hecho': ['done', 'completed', 'closed', 'cerrado', 'terminado', 'finalizado'],
  'revision': ['review', 'en review', 'in review', 'revisión'],
  'backlog': ['backlog', 'product backlog'],
  'testing': ['qa', 'quality assurance', 'testing', 'testing / qa', 'testing/qa'],
  'staging': ['deploy', 'deployment', 'staging', 'ci/cd', 'deploy / devops', 'deploy/devops'],
  'nuevo': ['new', 'nuevo'], 'triaje': ['triage', 'triaje'],
  'asignado': ['assigned', 'asignado'], 'esperando': ['waiting', 'esperando', 'on hold'],
  'code review': ['code review'], 'produccion': ['produccion', 'producción', 'production'],
  'monitoreo': ['monitoreo', 'monitoring'], 'sprint backlog': ['sprint backlog'],
  'listo para pull': ['listo para pull', 'ready for pull', 'ready'],
  'archivado': ['archivado', 'archived'], 'ideas': ['ideas'],
  'planificacion': ['planificacion', 'planificación', 'planning'],
  'creacion': ['creacion', 'creación', 'creation'],
  'aprobado': ['aprobado', 'approved'], 'publicado': ['publicado', 'published'],
  'analisis': ['analisis', 'análisis', 'analysis'],
  'diseno': ['diseno', 'diseño', 'design'], 'desarrollo': ['desarrollo', 'development', 'dev'],
  'prompts pendientes': ['prompts pendientes', 'pending prompts'],
  'diseno de agente': ['diseno de agente', 'diseño de agente', 'agent design'],
  'entrenamiento': ['entrenamiento', 'training'],
  'evaluacion': ['evaluacion', 'evaluación', 'evaluation'],
  'diseno de api': ['diseno de api', 'diseño de api', 'api design'],
  'seguridad / rls': ['seguridad / rls', 'seguridad/rls', 'security', 'rls'],
  'inspiracion': ['inspiracion', 'inspiración', 'inspiration'],
  'wireframes': ['wireframes'], 'diseno ui': ['diseno ui', 'diseño ui', 'ui design'],
  'prototipo': ['prototipo', 'prototype'],
  'desarrollo frontend': ['desarrollo frontend', 'frontend development', 'frontend dev'],
  'review / qa visual': ['review / qa visual', 'review/qa visual', 'visual qa'],
  'integracion': ['integracion', 'integración', 'integration'],
}
const clientSynLookup = new Map<string, string>()
for (const [canonical, syns] of Object.entries(clientSynonyms)) {
  for (const s of syns) clientSynLookup.set(stripAccents(s.toLowerCase()), canonical)
  clientSynLookup.set(stripAccents(canonical.toLowerCase()), canonical)
}
const clientTemplateSignatures: Record<string, string[]> = {
  simple: ['pendiente', 'en progreso', 'hecho'],
  kanban: ['backlog', 'pendiente', 'en progreso', 'revision', 'hecho'],
  dev: ['backlog', 'analisis', 'desarrollo', 'code review', 'testing', 'produccion'],
  devops: ['backlog', 'diseno', 'desarrollo', 'code review', 'staging', 'staging', 'produccion', 'monitoreo'],
  support: ['nuevo', 'triaje', 'asignado', 'en progreso', 'esperando', 'hecho'],
  scrum: ['backlog', 'sprint backlog', 'en progreso', 'revision', 'testing', 'hecho'],
  scrumban: ['backlog', 'listo para pull', 'en progreso', 'revision', 'testing', 'staging', 'hecho', 'archivado'],
  marketing: ['ideas', 'planificacion', 'creacion', 'revision', 'aprobado', 'publicado', 'analisis'],
  ai_agents: ['prompts pendientes', 'diseno de agente', 'entrenamiento', 'testing', 'evaluacion', 'produccion', 'monitoreo'],
  backend_senior_dev: ['backlog', 'diseno de api', 'desarrollo', 'code review', 'testing', 'seguridad / rls', 'staging', 'produccion', 'monitoreo'],
  frontend_design: ['inspiracion', 'wireframes', 'diseno ui', 'prototipo', 'desarrollo frontend', 'review / qa visual', 'integracion', 'publicado'],
}
const templateLabels: Record<string, string> = {
  simple: 'Simple', kanban: 'Kanban Clásico', dev: 'Desarrollo IT', devops: 'DevOps',
  support: 'Soporte', scrum: 'Scrum', scrumban: 'Scrumban', marketing: 'Marketing',
  ai_agents: 'Agentes AI', backend_senior_dev: 'Backend Senior Dev', frontend_design: 'Frontend & Design',
}

function suggestTemplateClient(statuses: string[]): { template: string; score: number; matched: number; total: number } | null {
  if (statuses.length === 0) return null
  const normalized = statuses.map(s => clientSynLookup.get(stripAccents(s.trim().toLowerCase())) || stripAccents(s.trim().toLowerCase()))
  const uniqueNorm = new Set(normalized)
  let best = { template: 'simple', score: 0, matched: 0, total: 3 }
  for (const [tpl, sig] of Object.entries(clientTemplateSignatures)) {
    const sigSet = new Set(sig)
    const matched = normalized.filter(n => sigSet.has(n)).length
    const uniqueCols = sigSet.size
    // Jaccard similarity
    const score = matched / (uniqueNorm.size + uniqueCols - matched)
    if (score > best.score) best = { template: tpl, score, matched, total: uniqueCols }
  }
  return best.score >= 0.3 ? best : null
}

function updateImportPreview() {
  if (!importCsv.value.trim()) { importPreview.value = null; return }
  const lines = importCsv.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) { importPreview.value = null; return }
  const headers = parseCsvLineSimple(lines[0]!).map(h => h.toLowerCase().replace(/^"|"$/g, ''))
  const headersNorm = headers.map(stripAccents)
  const hasH = (name: string) => headers.includes(name) || headersNorm.includes(stripAccents(name))
  let platform = 'generic'
  if (hasH('estimate') && hasH('cycle number')) platform = 'linear'
  else if (hasH('issue key') && hasH('summary')) platform = 'jira'
  else if ((hasH('card name') || hasH('card id')) && hasH('list')) platform = 'trello'
  else if (hasH('task name') && hasH('estimated time')) platform = 'clickup'
  else if (hasH('nombre') && (hasH('persona asignada') || hasH('fecha límite') || hasH('fecha limite'))) platform = 'clickup_es'
  const dataLines = lines.slice(1).filter(l => l.trim())
  const count = dataLines.length

  // Extract unique status values for template suggestion
  const statusIdx = headers.findIndex(h => ['status', 'estado', 'list', 'columna', 'state'].includes(h))
  let suggestion: typeof importPreview.value extends { suggestedTemplate?: infer T } ? T : never = undefined
  if (statusIdx >= 0) {
    const statuses = [...new Set(dataLines.map(l => parseCsvLineSimple(l)[statusIdx]?.trim()).filter(Boolean))] as string[]
    const result = suggestTemplateClient(statuses)
    if (result) {
      newProject.template = result.template
      suggestion = { template: result.template, label: templateLabels[result.template] || result.template, matched: result.matched, total: result.total }
    }
  }

  importPreview.value = { platform, count, suggestedTemplate: suggestion }
}

function clearImportCsv() {
  importCsv.value = ''
  importPreview.value = null
}

// Delete project
const showDeleteConfirm = ref(false)
const projectToDelete = ref<any>(null)
const deleting = ref(false)

function confirmDeleteProject(project: any) {
  projectToDelete.value = project
  showDeleteConfirm.value = true
}

async function handleDeleteProject() {
  if (!projectToDelete.value) return
  deleting.value = true
  try {
    await store.deleteProject(projectToDelete.value.id)
    showDeleteConfirm.value = false
    projectToDelete.value = null
  } catch (e: any) {
    console.error('Error deleting project:', e)
  } finally {
    deleting.value = false
  }
}

// Task stats
const totalTasks = ref(0)
const completedTaskCount = ref(0)
const dueTodayCount = ref(0)

// Generate stable random bar heights (decorative mini charts)
function generateBarHeights() {
  return Array.from({ length: 7 }, () => Math.round(20 + Math.random() * 80))
}
const barHeights = reactive({
  projects: generateBarHeights(),
  tasks: generateBarHeights(),
  dueToday: generateBarHeights(),
  completed: generateBarHeights(),
})

// Load stats via server API to avoid RLS issues with direct client queries
watch(() => store.workspace?.id, async (wsId) => {
  if (!wsId || store.projects.length === 0) return
  try {
    const stats = await $fetch<{
      totalTasks: number
      completedTasks: number
      dueTodayTasks: number
    }>(`/api/workspaces/${wsId}/stats`)
    totalTasks.value = stats.totalTasks
    completedTaskCount.value = stats.completedTasks
    dueTodayCount.value = stats.dueTodayTasks
  } catch { /* silent */ }
}, { immediate: true })

const priorityOptions = computed(() => [
  { label: t.value.priorityLow, value: 'low' },
  { label: t.value.priorityMedium, value: 'medium' },
  { label: t.value.priorityHigh, value: 'high' },
  { label: t.value.priorityCritical, value: 'critical' },
])
const templateConfigs = [
  {
    label: 'Simple', value: 'simple', cols: 3,
    columns: [
      { title: 'Pendiente', color: '#3B82F6' },
      { title: 'En Progreso', color: '#F59E0B' },
      { title: 'Hecho', color: '#10B981' },
    ],
  },
  {
    label: 'Kanban Clásico', value: 'kanban', cols: 5,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'To Do', color: '#3B82F6' },
      { title: 'En Progreso', color: '#F59E0B' },
      { title: 'Revisión', color: '#8B5CF6' },
      { title: 'Hecho', color: '#10B981' },
    ],
  },
  {
    label: 'Desarrollo IT', value: 'dev', cols: 6,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Análisis', color: '#8B5CF6' },
      { title: 'Dev', color: '#3B82F6' },
      { title: 'Code Review', color: '#F59E0B' },
      { title: 'QA', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
    ],
  },
  {
    label: 'DevOps', value: 'devops', cols: 8,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Diseño', color: '#8B5CF6' },
      { title: 'Desarrollo', color: '#3B82F6' },
      { title: 'Code Review', color: '#6366F1' },
      { title: 'CI/CD', color: '#F59E0B' },
      { title: 'Staging', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
      { title: 'Monitoreo', color: '#14B8A6' },
    ],
  },
  {
    label: 'Soporte', value: 'support', cols: 6,
    columns: [
      { title: 'Nuevo', color: '#3B82F6' },
      { title: 'Triaje', color: '#6366F1' },
      { title: 'Asignado', color: '#8B5CF6' },
      { title: 'En Proceso', color: '#F59E0B' },
      { title: 'Esperando', color: '#F97316' },
      { title: 'Cerrado', color: '#10B981' },
    ],
  },
  {
    label: 'Scrum', value: 'scrum', cols: 6,
    columns: [
      { title: 'Product Backlog', color: '#6B7280' },
      { title: 'Sprint Backlog', color: '#6366F1' },
      { title: 'En Progreso', color: '#3B82F6' },
      { title: 'En Review', color: '#F59E0B' },
      { title: 'QA', color: '#8B5CF6' },
      { title: 'Done', color: '#10B981' },
    ],
  },
  {
    label: 'Scrumban', value: 'scrumban', cols: 8,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Listo para Pull', color: '#6366F1' },
      { title: 'En Progreso', color: '#3B82F6' },
      { title: 'Review', color: '#F59E0B' },
      { title: 'Testing', color: '#8B5CF6' },
      { title: 'Deploy', color: '#F97316' },
      { title: 'Done', color: '#10B981' },
      { title: 'Archivado', color: '#9CA3AF' },
    ],
  },
  {
    label: 'Marketing', value: 'marketing', cols: 7,
    columns: [
      { title: 'Ideas', color: '#EC4899' },
      { title: 'Planificación', color: '#8B5CF6' },
      { title: 'Creación', color: '#3B82F6' },
      { title: 'Revisión', color: '#F59E0B' },
      { title: 'Aprobado', color: '#10B981' },
      { title: 'Publicado', color: '#06B6D4' },
      { title: 'Análisis', color: '#6366F1' },
    ],
  },
  {
    label: 'Agentes AI', value: 'ai_agents', cols: 7,
    columns: [
      { title: 'Prompts Pendientes', color: '#6B7280' },
      { title: 'Diseño de Agente', color: '#8B5CF6' },
      { title: 'Entrenamiento', color: '#3B82F6' },
      { title: 'Testing', color: '#F59E0B' },
      { title: 'Evaluación', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
      { title: 'Monitoreo', color: '#06B6D4' },
    ],
  },
  {
    label: 'Backend Senior Dev', value: 'backend_senior_dev', cols: 9,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Diseño de API', color: '#8B5CF6' },
      { title: 'Desarrollo', color: '#3B82F6' },
      { title: 'Code Review', color: '#6366F1' },
      { title: 'Testing / QA', color: '#F59E0B' },
      { title: 'Seguridad / RLS', color: '#EF4444' },
      { title: 'Deploy / DevOps', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
      { title: 'Monitoreo', color: '#14B8A6' },
    ],
  },
  {
    label: 'Frontend & Design', value: 'frontend_design', cols: 8,
    columns: [
      { title: 'Inspiración', color: '#EC4899' },
      { title: 'Wireframes', color: '#8B5CF6' },
      { title: 'Diseño UI', color: '#6366F1' },
      { title: 'Prototipo', color: '#3B82F6' },
      { title: 'Desarrollo Frontend', color: '#F59E0B' },
      { title: 'Review / QA Visual', color: '#F97316' },
      { title: 'Integración', color: '#14B8A6' },
      { title: 'Publicado', color: '#10B981' },
    ],
  },
]

async function handleCreateProject() {
  createError.value = ''
  creating.value = true
  try {
    if (importCsv.value.trim()) {
      // Create project + import tasks in one call
      const res = await $fetch<any>(`/api/workspaces/${store.workspace!.id}/import/project`, {
        method: 'POST',
        body: {
          name: newProject.name,
          description: newProject.description,
          priority: newProject.priority,
          kanban_template: newProject.template,
          csv: importCsv.value,
        },
      })
      // Reload projects list (loadWorkspace short-circuits if slug unchanged)
      await store.loadProjects()
      showCreate.value = false
      Object.assign(newProject, { name: '', description: '', priority: 'medium', template: 'simple' })
      clearImportCsv()
      // Navigate to the new project
      if (res.project?.id) {
        navigateTo(`/${store.slug}/projects/${res.project.id}/kanban`)
      }
    } else {
      const priorityVal = typeof newProject.priority === 'object' ? (newProject.priority as any).value || 'medium' : newProject.priority
      await store.createProject({
        name: newProject.name,
        description: newProject.description,
        priority: priorityVal,
        kanban_template: newProject.template,
      })
      showCreate.value = false
      Object.assign(newProject, { name: '', description: '', priority: 'medium', template: 'simple' })
    }
  } catch (e: any) {
    createError.value = e.data?.message || e.message || (lang.language.value === 'en' ? 'Error creating project' : 'Error al crear el proyecto')
  } finally {
    creating.value = false
  }
}

function statusClasses(s: string) {
  return ({ active: 'bg-emerald-50 text-emerald-700', planning: 'bg-sky-50 text-sky-700', review: 'bg-amber-50 text-amber-700', completed: 'bg-gray-100 text-gray-500', paused: 'bg-red-50 text-red-700' }[s] || 'bg-gray-100 text-gray-500')
}
function statusLabel(s: string) {
  const en = lang.language.value === 'en'
  return { active: en ? 'Active' : 'Activo', planning: en ? 'Planning' : 'Planificación', review: en ? 'Review' : 'Revisión', completed: en ? 'Completed' : 'Completado', paused: en ? 'Paused' : 'Pausado' }[s] || s
}
function priorityClasses(p: string) {
  return ({ critical: 'bg-red-50 text-red-700', high: 'bg-amber-50 text-amber-700', medium: 'bg-sky-50 text-sky-700', low: 'bg-gray-100 text-gray-500' }[p] || 'bg-gray-100 text-gray-500')
}
function priorityLabel(p: string) {
  const en = lang.language.value === 'en'
  return { critical: en ? 'Critical' : 'Crítica', high: en ? 'High' : 'Alta', medium: en ? 'Medium' : 'Media', low: en ? 'Low' : 'Baja' }[p] || p
}
</script>
