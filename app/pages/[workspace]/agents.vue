<template>
  <div class="min-h-screen">
    <!-- Gradient Hero Header -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-8 mb-8 shadow-xl">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIi8+PC9zdmc+')] opacity-60"></div>
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl"></div>
      <div class="relative flex items-center gap-5">
        <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shadow-lg">
          <UIcon name="i-heroicons-cpu-chip" class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">{{ t.aiAgents }}</h1>
          <p class="text-sm text-indigo-100/80 mt-1 max-w-lg">{{ t.agentsDesc }}</p>
        </div>
      </div>
    </div>

    <!-- Project selector -->
    <div class="mb-8 max-w-xs">
      <label class="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 block">{{ t.project }}</label>
      <USelectMenu
        v-model="selectedProjectId"
        :items="projectOptions"
        value-key="value"
        :placeholder="t.selectProject"
        class="w-full"
      />
    </div>

    <div v-if="!canUseAI" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-gray-300 dark:text-gray-600" />
      </div>
      <p class="text-sm text-gray-400 dark:text-gray-500">{{ t.noAIPermission }}</p>
    </div>

    <div v-else-if="!selectedProjectId" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-100 dark:ring-indigo-500/20">
        <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-indigo-300" />
      </div>
      <p class="text-sm text-gray-400 dark:text-gray-500">{{ t.selectProjectFirst }}</p>
    </div>

    <template v-else>
    <!-- Specialist Agent Team -->
    <div v-if="canUseAI" class="mb-10">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
          <UIcon name="i-heroicons-user-group" class="w-4 h-4 text-white" />
        </div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ en ? 'Specialist Team' : 'Equipo de Especialistas' }}</h2>
        <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-500/20">{{ AI_AGENTS.length }} agents</span>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-5 ml-11">
        {{ en ? 'Pick a specialist, give it a brief, and it creates ready-to-work tasks on the board delegated to itself.' : 'Elige un especialista, dale un brief, y crea tareas listas en el tablero delegadas a sí mismo.' }}
      </p>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 mb-4">
        <button
          v-for="agent in AI_AGENTS"
          :key="agent.type"
          class="group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all cursor-pointer text-center"
          :class="activeSpecialist === agent.type
            ? 'border-transparent shadow-md scale-[1.02]'
            : 'bg-white/80 dark:bg-[#1b1b1b]/80 border-gray-100/80 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:-translate-y-0.5'"
          :style="activeSpecialist === agent.type ? { backgroundColor: agent.color + '14', boxShadow: `inset 0 0 0 1.5px ${agent.color}` } : {}"
          @click="toggleSpecialist(agent.type)"
        >
          <span class="text-xl">{{ agent.emoji }}</span>
          <span class="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">{{ en ? agent.nameEn : agent.name }}</span>
          <span class="text-[9px] text-gray-400 dark:text-gray-500 leading-tight line-clamp-2">{{ en ? agent.specialtyEn : agent.specialty }}</span>
        </button>
      </div>

      <!-- Specialist brief panel -->
      <Transition name="submenu">
        <div
          v-if="activeSpecialistInfo"
          class="rounded-2xl border p-4 space-y-3"
          :style="{ borderColor: activeSpecialistInfo.color + '44', backgroundColor: activeSpecialistInfo.color + '0a' }"
        >
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">{{ activeSpecialistInfo.emoji }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ en ? activeSpecialistInfo.nameEn : activeSpecialistInfo.name }}</p>
              <p class="text-[11px] text-gray-500 dark:text-gray-400">{{ en ? activeSpecialistInfo.specialtyEn : activeSpecialistInfo.specialty }}</p>
            </div>
          </div>
          <textarea
            v-model="specialistBrief"
            rows="3"
            :placeholder="en ? `What do you need from ${activeSpecialistInfo.nameEn}? e.g. 'Define launch pricing for our SaaS with 3 tiers'` : `¿Qué necesitas de ${activeSpecialistInfo.name}? Ej: 'Define el pricing de lanzamiento de nuestro SaaS con 3 planes'`"
            class="w-full bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-focusflow-400/50 resize-none"
          />
          <DocAttach v-model="specialistDocs" :label="en ? 'Context docs' : 'Docs de contexto'" />
          <div class="flex items-center justify-between gap-2">
            <label class="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input v-model="specialistCreateTasks" type="checkbox" class="accent-focusflow-500">
              {{ en ? 'Create tasks on the board' : 'Crear tareas en el tablero' }}
            </label>
            <button
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-sm"
              :style="{ background: `linear-gradient(135deg, ${activeSpecialistInfo.color}, ${activeSpecialistInfo.color}CC)` }"
              :disabled="specialistRunning || specialistBrief.trim().length < 10"
              @click="runSpecialist"
            >
              <UIcon :name="specialistRunning ? 'i-heroicons-arrow-path' : 'i-heroicons-play'" class="w-3.5 h-3.5" :class="{ 'animate-spin': specialistRunning }" />
              {{ specialistRunning ? (en ? 'Working…' : 'Trabajando…') : (en ? 'Run agent' : 'Ejecutar agente') }}
            </button>
          </div>

          <!-- Result -->
          <div v-if="specialistResult" class="bg-white/80 dark:bg-white/[0.04] rounded-xl p-4 space-y-3 ring-1 ring-gray-100 dark:ring-white/10">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p class="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{{ specialistResult.summary }}</p>
            </div>
            <div v-if="specialistResult.recommendations?.length" class="space-y-1">
              <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ en ? 'Recommendations' : 'Recomendaciones' }}</p>
              <div v-for="(r, ri) in specialistResult.recommendations" :key="ri" class="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                <UIcon name="i-heroicons-light-bulb" class="w-3 h-3 mt-0.5 shrink-0" :style="{ color: activeSpecialistInfo.color }" />
                <span>{{ r }}</span>
              </div>
            </div>
            <div v-if="specialistResult.tasks?.length" class="space-y-1 pt-2 border-t border-gray-100 dark:border-white/10">
              <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {{ specialistResult.tasks_created }} {{ en ? 'tasks created' : 'tareas creadas' }}
              </p>
              <div v-for="task in specialistResult.tasks" :key="task.id" class="flex items-center gap-2 text-[11px] py-0.5">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-bold" :class="task.priority === 'critical' || task.priority === 'high' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'">{{ task.priority }}</span>
                <span class="text-gray-700 dark:text-gray-300 truncate">{{ task.title }}</span>
                <span v-if="task.estimated_hours" class="text-[10px] text-gray-400 tabular-nums shrink-0">{{ task.estimated_hours }}h</span>
              </div>
            </div>
          </div>
          <p v-if="specialistError" class="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{{ specialistError }}</p>
        </div>
      </Transition>
    </div>

    <!-- Section Divider -->
    <div v-if="canUseAI && canUseDocAgents" class="relative my-10">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200/60 dark:border-white/10"></div>
      </div>
      <div class="relative flex justify-center">
        <div class="bg-white dark:bg-[#111] px-4 flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-purple-300"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
        </div>
      </div>
    </div>

    <!-- Documentation Agents -->
    <div v-if="canUseDocAgents">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
          <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-white" />
        </div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ t.documentation }}</h2>
        <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-500/20">Agents</span>
      </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="agent in agents"
        :key="agent.action"
        class="group relative bg-white/80 dark:bg-[#1b1b1b]/80 backdrop-blur-sm border border-gray-100/80 dark:border-white/10 rounded-2xl p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 hover:border-gray-200/80 dark:hover:border-white/15 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50/50 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative">
          <!-- Agent header -->
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5"
              :style="{ background: `linear-gradient(135deg, ${agent.color}18, ${agent.color}30)` }"
            >
              <UIcon :name="agent.icon" class="w-5 h-5" :style="{ color: agent.color }" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ agent.name }}</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{{ agent.folder }}</p>
            </div>
          </div>

          <!-- Description -->
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3.5 leading-relaxed">{{ agent.description }}</p>

          <!-- Tags -->
          <div class="flex gap-1.5 flex-wrap mb-4">
            <span
              v-for="tag in agent.tags"
              :key="tag"
              class="text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1"
              :style="{ backgroundColor: agent.color + '08', color: agent.color, boxShadow: `inset 0 0 0 1px ${agent.color}20` }"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Action button -->
          <button
            class="w-full text-center py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            :style="{
              background: agentRunning === agent.action ? agent.color + '10' : `linear-gradient(135deg, ${agent.color}, ${agent.color}DD)`,
              color: agentRunning === agent.action ? agent.color : '#FFFFFF',
            }"
            :disabled="!!agentRunning"
            @click="runAgent(agent.action)"
          >
            <span v-if="agentRunning === agent.action" class="flex items-center justify-center gap-1.5">
              <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
              {{ t.generating }}
            </span>
            <span v-else>{{ t.generateDocs }}</span>
          </button>

          <!-- Result -->
          <div v-if="agentResults[agent.action]" class="mt-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-white/5 dark:to-white/3 rounded-xl p-4 space-y-2.5 ring-1 ring-gray-100 dark:ring-white/10">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p class="text-xs font-bold text-gray-900 dark:text-white">{{ agentResults[agent.action].title }}</p>
            </div>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 italic pl-6">{{ agentResults[agent.action].summary }}</p>

            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="agentResults[agent.action].tasksCreated > 0" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-500/30">
                {{ agentResults[agent.action].tasksCreated }} {{ t.tasks }}
              </span>
              <span v-if="agentResults[agent.action].savedFile" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-500/20">
                {{ t.savedMd }}
              </span>
              <span v-if="agentResults[agent.action].sessionId" class="text-[10px] font-mono px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-white/20">
                {{ agentResults[agent.action].sessionId.slice(0, 8) }}
              </span>
            </div>

            <!-- Sections preview -->
            <div v-if="agentResults[agent.action].sections?.length" class="space-y-1.5 mt-3 pt-3 border-t border-gray-200/80 dark:border-white/10">
              <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <UIcon name="i-heroicons-list-bullet" class="w-3.5 h-3.5 text-blue-400" />
                {{ t.sections }}
              </p>
              <div v-for="(section, si) in agentResults[agent.action].sections.slice(0, 4)" :key="si" class="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-white/5 rounded-lg p-2">
                <span class="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold shrink-0">{{ Number(si) + 1 }}</span>
                {{ section.heading }}
              </div>
              <p v-if="(agentResults[agent.action].sections as any[]).length > 4" class="text-[10px] text-gray-400 dark:text-gray-500 pl-7">
                +{{ (agentResults[agent.action].sections as any[]).length - 4 }} {{ t.more }}
              </p>
            </div>

            <!-- Created tasks -->
            <div v-if="agentResults[agent.action].createdTasks?.length" class="mt-3 pt-3 border-t border-gray-200/80 dark:border-white/10">
              <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UIcon name="i-heroicons-clipboard-document-check" class="w-3.5 h-3.5 text-emerald-400" />
                {{ t.tasksCreated }}
              </p>
              <div v-for="(task, ti) in agentResults[agent.action].createdTasks.slice(0, 3)" :key="ti" class="flex items-center gap-1.5 text-[10px] py-1">
                <span
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold ring-1"
                  :class="task.priority === 'high' || task.priority === 'critical' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-100 dark:ring-red-500/30' : 'bg-gray-50 dark:bg-white/10 text-gray-600 dark:text-gray-400 ring-gray-100 dark:ring-white/20'"
                >{{ task.priority }}</span>
                <span class="text-gray-700 dark:text-gray-300 truncate">{{ task.title }}</span>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-if="agentErrors[agent.action]" class="mt-3 bg-red-50 dark:bg-red-500/10 rounded-xl p-3 ring-1 ring-red-100 dark:ring-red-500/30 flex items-start gap-2">
            <UIcon name="i-heroicons-x-circle" class="w-3.5 h-3.5 text-red-400 dark:text-red-400 mt-0.5 shrink-0" />
            <p class="text-[10px] text-red-600 dark:text-red-400">{{ agentErrors[agent.action] }}</p>
          </div>
        </div>
      </div>
    </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()
const { canUseAI, canUseDocAgents } = usePermissions()
const lang = useLanguage()
const t = lang.labels


const agents = computed(() => {
  const en = lang.language.value === 'en'
  return [
    {
      action: 'doc_backend_architecture',
      name: 'Backend Senior Architecture',
      description: en ? 'Generates detailed backend architecture documentation: APIs, data models, design patterns, security and testing.' : 'Genera documentación detallada de arquitectura backend: APIs, modelos de datos, patrones de diseño, seguridad y testing.',
      icon: 'i-heroicons-server-stack',
      color: '#3B82F6',
      folder: '/docs/backend',
      tags: en ? ['backend', 'architecture'] : ['backend', 'arquitectura'],
    },
    {
      action: 'doc_aws_expert',
      name: 'AWS Senior Expert',
      description: en ? 'Documents AWS infrastructure: services, configuration, costs, security, scalability and disaster recovery.' : 'Documenta infraestructura AWS: servicios, configuración, costos, seguridad, escalabilidad y disaster recovery.',
      icon: 'i-heroicons-cloud',
      color: '#F59E0B',
      folder: '/docs/aws',
      tags: ['aws', 'cloud', 'infra'],
    },
    {
      action: 'doc_frontend_design',
      name: 'Frontend Design (Context7)',
      description: en ? 'Generates frontend design guides with real Vue, Nuxt, Tailwind and Pinia documentation via Context7 API.' : 'Genera guías de diseño frontend con documentación real de Vue, Nuxt, Tailwind y Pinia vía Context7 API.',
      icon: 'i-heroicons-paint-brush',
      color: '#EC4899',
      folder: '/docs/frontend',
      tags: en ? ['frontend', 'design', 'ui'] : ['frontend', 'diseño', 'ui'],
    },
    {
      action: 'doc_marketing',
      name: 'Marketing Documentation',
      description: en ? 'Creates marketing strategy documentation: audience, channels, content, metrics and growth roadmap.' : 'Crea documentación de estrategia de marketing: audiencia, canales, contenido, métricas y roadmap de crecimiento.',
      icon: 'i-heroicons-megaphone',
      color: '#8B5CF6',
      folder: '/docs/marketing',
      tags: en ? ['marketing', 'strategy'] : ['marketing', 'estrategia'],
    },
    {
      action: 'doc_ai_agents',
      name: 'AI Agents Documentation',
      description: en ? 'Documents the AI agent system: prompts, flows, models, embeddings, memory and optimization.' : 'Documenta el sistema de agentes AI: prompts, flujos, modelos, embeddings, memoria y optimización.',
      icon: 'i-heroicons-cpu-chip',
      color: '#10B981',
      folder: '/docs/agents',
      tags: en ? ['ai', 'agents', 'prompts'] : ['ai', 'agentes', 'prompts'],
    },
  ]
})

const selectedProjectId = ref('')
const agentRunning = ref<string | null>(null)
const agentResults = ref<Record<string, any>>({})
const agentErrors = ref<Record<string, string>>({})

// ── Specialist agent team ──
const en = computed(() => lang.language.value === 'en')
const activeSpecialist = ref('')
const specialistBrief = ref('')
const specialistDocs = ref<{ name: string; content: string }[]>([])
const specialistCreateTasks = ref(true)
const specialistRunning = ref(false)
const specialistResult = ref<any>(null)
const specialistError = ref('')

const activeSpecialistInfo = computed(() => AI_AGENTS.find(a => a.type === activeSpecialist.value) || null)

function toggleSpecialist(type: string) {
  if (activeSpecialist.value === type) {
    activeSpecialist.value = ''
  } else {
    activeSpecialist.value = type
    specialistResult.value = null
    specialistError.value = ''
  }
}

async function runSpecialist() {
  if (!selectedProjectId.value || !activeSpecialist.value || specialistBrief.value.trim().length < 10 || specialistRunning.value) return
  specialistRunning.value = true
  specialistError.value = ''
  specialistResult.value = null
  try {
    specialistResult.value = await $fetch(`/api/workspaces/${store.workspace!.id}/agents/run`, {
      method: 'POST',
      body: {
        project_id: selectedProjectId.value,
        agent_type: activeSpecialist.value,
        brief: specialistBrief.value,
        create_tasks: specialistCreateTasks.value,
        document: specialistDocs.value.length
          ? specialistDocs.value.map(f => `--- Archivo: ${f.name} ---\n${f.content}`).join('\n\n')
          : undefined,
      },
    })
    specialistBrief.value = ''
    specialistDocs.value = []
  } catch (e: any) {
    specialistError.value = e.data?.message || e.message || (en.value ? 'Error running agent' : 'Error al ejecutar el agente')
  } finally {
    specialistRunning.value = false
  }
}

const projectOptions = computed(() =>
  (store.projects || []).map(p => ({ label: p.name, value: p.id }))
)

onMounted(() => {
  if (!store.projectsLoaded) store.loadProjects()
})

async function runAgent(action: string) {
  if (!selectedProjectId.value || agentRunning.value) return

  agentRunning.value = action
  agentErrors.value[action] = ''

  try {
    const context: Record<string, any> = { projectId: selectedProjectId.value }

    const res = await $fetch<{ type: string; data: any }>('/api/ai/assist', {
      method: 'POST',
      body: { action, context },
    })

    if (res?.type === 'json' && (res.data?.title || res.data?.summary || res.data?.sprint_name || res.data?.feature_summary || res.data?.health_score || res.data?.improvements)) {
      agentResults.value[action] = res.data
    } else {
      agentErrors.value[action] = lang.language.value === 'en' ? 'Unexpected agent response' : 'Respuesta inesperada del agente'
    }
  } catch (e: any) {
    agentErrors.value[action] = e.data?.message || e.message || (lang.language.value === 'en' ? 'Error running agent' : 'Error al ejecutar agente')
  } finally {
    agentRunning.value = null
  }
}
</script>
