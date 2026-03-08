<template>
  <div class="animate-fade-up">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-cpu-chip" class="w-7 h-7 text-purple-600 dark:text-purple-400" />
          {{ lang.language.value === 'en' ? 'AI Orchestrator' : 'Orquestador AI' }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ lang.language.value === 'en' ? 'Decompose tasks and delegate to specialized AI agents' : 'Descomponer tareas y delegar a agentes AI especializados' }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Left: Prompt panel -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Project selector -->
        <div class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
            {{ lang.language.value === 'en' ? 'Target Project' : 'Proyecto Destino' }}
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in projects"
              :key="p.id"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer"
              :class="selectedProject === p.id
                ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'"
              @click="selectedProject = p.id"
            >
              {{ p.name }}
            </button>
          </div>
        </div>

        <!-- Prompt input -->
        <div class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
            {{ lang.language.value === 'en' ? 'What needs to be done?' : 'Que necesitas hacer?' }}
          </label>
          <textarea
            v-model="prompt"
            rows="4"
            class="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
            :placeholder="lang.language.value === 'en'
              ? 'Describe the feature, bug fix, or task to decompose into subtasks...\n\nExample: Build a user authentication system with email verification, password reset, and OAuth2 Google login.'
              : 'Describe la funcionalidad, bugfix o tarea a descomponer en subtareas...\n\nEjemplo: Construir un sistema de autenticacion de usuarios con verificacion de email, reseteo de contraseña y login con Google OAuth2.'"
          />
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <button
                  class="w-9 h-5 rounded-full transition-colors relative"
                  :class="autoDelegate ? 'bg-purple-500' : 'bg-gray-300 dark:bg-white/20'"
                  @click="autoDelegate = !autoDelegate"
                >
                  <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" :class="autoDelegate ? 'translate-x-[18px]' : 'translate-x-0.5'" />
                </button>
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ lang.language.value === 'en' ? 'Auto-assign agents' : 'Auto-asignar agentes' }}</span>
              </label>
            </div>
            <UButton
              color="primary"
              :loading="orchestrating"
              :disabled="!selectedProject || !prompt.trim()"
              class="bg-purple-600 hover:bg-purple-700 font-semibold"
              @click="runOrchestrator"
            >
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4 mr-1" />
              {{ lang.language.value === 'en' ? 'Orchestrate' : 'Orquestar' }}
            </UButton>
          </div>
        </div>

        <!-- Results -->
        <div v-if="lastResult" class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ lastResult.tasks_created }} {{ lang.language.value === 'en' ? 'tasks created' : 'tareas creadas' }}
              </p>
              <p v-if="lastResult.agents_used?.length" class="text-[10px] text-gray-400">
                {{ lang.language.value === 'en' ? 'Agents:' : 'Agentes:' }} {{ lastResult.agents_used.join(', ') }}
              </p>
            </div>
          </div>
          <div class="space-y-2">
            <div
              v-for="task in lastResult.tasks"
              :key="task.id"
              class="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="{
                  'bg-red-500': task.priority === 'high' || task.priority === 'urgent',
                  'bg-blue-400': task.priority === 'medium',
                  'bg-gray-300': task.priority === 'low',
                }"
              />
              <p class="text-xs text-gray-900 dark:text-white flex-1 truncate">{{ task.title }}</p>
              <span v-if="task.ai_agent" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                {{ task.ai_agent }}
              </span>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p class="text-sm text-red-700 dark:text-red-300">{{ errorMsg }}</p>
        </div>
      </div>

      <!-- Right: Recent runs + agent info -->
      <div class="space-y-5">
        <!-- Agent types -->
        <div class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 p-4">
          <h3 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {{ lang.language.value === 'en' ? 'Available Agents' : 'Agentes Disponibles' }}
          </h3>
          <div class="space-y-2">
            <div v-for="agent in agentList" :key="agent.id" class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :class="agent.bgClass">
                <UIcon :name="agent.icon" class="w-3.5 h-3.5" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-900 dark:text-white">{{ agent.name }}</p>
                <p class="text-[10px] text-gray-400">{{ agent.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent runs -->
        <div class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 p-4">
          <h3 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {{ lang.language.value === 'en' ? 'Recent Runs' : 'Ejecuciones Recientes' }}
          </h3>
          <div v-if="recentRuns.length === 0" class="text-xs text-gray-400 py-4 text-center">
            {{ lang.language.value === 'en' ? 'No runs yet' : 'Sin ejecuciones aun' }}
          </div>
          <div v-else class="space-y-2">
            <div v-for="run in recentRuns" :key="run.id" class="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
              <div class="flex items-center justify-between">
                <span
                  class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  :class="{
                    'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300': run.status === 'completed',
                    'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300': run.status === 'failed',
                    'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300': run.status === 'running',
                    'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400': run.status === 'pending',
                  }"
                >
                  {{ run.status }}
                </span>
                <span class="text-[10px] text-gray-400">{{ formatTime(run.created_at) }}</span>
              </div>
              <p class="text-[11px] text-gray-700 dark:text-gray-300 mt-1 truncate">{{ run.prompt?.slice(0, 80) }}</p>
              <p v-if="run.tasks_created?.length" class="text-[10px] text-gray-400 mt-0.5">{{ run.tasks_created.length }} tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const lang = useLanguage()
const store = useWorkspaceStore()
const route = useRoute()

const workspaceSlug = computed(() => route.params.workspace as string)
const workspaceId = computed(() => store.workspace?.id || '')

const projects = ref<any[]>([])
const selectedProject = ref('')
const prompt = ref('')
const autoDelegate = ref(true)
const orchestrating = ref(false)
const lastResult = ref<any>(null)
const errorMsg = ref('')
const recentRuns = ref<any[]>([])

const agentList = [
  { id: 'backend', name: 'Backend', desc: 'APIs, DB, Auth, Performance', icon: 'i-heroicons-server-stack', bgClass: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  { id: 'frontend', name: 'Frontend', desc: 'UI, Components, Styling', icon: 'i-heroicons-paint-brush', bgClass: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400' },
  { id: 'qa', name: 'QA', desc: 'Testing, Bug Verification', icon: 'i-heroicons-bug-ant', bgClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  { id: 'devops', name: 'DevOps', desc: 'CI/CD, Infrastructure', icon: 'i-heroicons-cloud', bgClass: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
  { id: 'designer', name: 'Designer', desc: 'UI/UX, Mockups', icon: 'i-heroicons-swatch', bgClass: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' },
  { id: 'copywriter', name: 'Copywriter', desc: 'Docs, Content', icon: 'i-heroicons-pencil-square', bgClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  { id: 'data', name: 'Data', desc: 'Analytics, Reports', icon: 'i-heroicons-chart-bar', bgClass: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  { id: 'security', name: 'Security', desc: 'Audit, Hardening', icon: 'i-heroicons-shield-check', bgClass: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' },
]

async function loadProjects() {
  if (!workspaceId.value) return
  try {
    projects.value = await $fetch<any[]>(`/api/workspaces/${workspaceId.value}/projects`)
    if (projects.value.length > 0 && !selectedProject.value) {
      selectedProject.value = projects.value[0].id
    }
  } catch {}
}

async function loadRecentRuns() {
  if (!workspaceId.value) return
  try {
    const { data } = await $fetch<any>(`/api/workspaces/${workspaceId.value}/orchestrator/runs`)
    recentRuns.value = data || []
  } catch {
    recentRuns.value = []
  }
}

async function runOrchestrator() {
  if (!selectedProject.value || !prompt.value.trim()) return
  orchestrating.value = true
  errorMsg.value = ''
  lastResult.value = null

  try {
    const result = await $fetch<any>(`/api/workspaces/${workspaceId.value}/orchestrator`, {
      method: 'POST',
      body: {
        project_id: selectedProject.value,
        prompt: prompt.value.trim(),
        auto_delegate: autoDelegate.value,
      },
    })

    lastResult.value = result
    prompt.value = ''
    loadRecentRuns()
  } catch (e: any) {
    errorMsg.value = e.data?.message || e.message || 'Error running orchestrator'
  } finally {
    orchestrating.value = false
  }
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return lang.language.value === 'en' ? 'just now' : 'ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return `${Math.floor(diffH / 24)}d`
}

watch(workspaceId, () => {
  loadProjects()
  loadRecentRuns()
}, { immediate: true })
</script>
