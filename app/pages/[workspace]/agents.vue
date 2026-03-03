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
      <label class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{{ t.project }}</label>
      <USelectMenu
        v-model="selectedProjectId"
        :items="projectOptions"
        value-key="value"
        :placeholder="t.selectProject"
        class="w-full"
      />
    </div>

    <div v-if="!canUseAI" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-gray-300" />
      </div>
      <p class="text-sm text-gray-400">{{ t.noAIPermission }}</p>
    </div>

    <div v-else-if="!selectedProjectId" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-100">
        <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-indigo-300" />
      </div>
      <p class="text-sm text-gray-400">{{ t.selectProjectFirst }}</p>
    </div>

    <template v-else>
    <!-- Task Management Agents -->
    <div v-if="canUseAI" class="mb-10">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <UIcon name="i-heroicons-queue-list" class="w-4 h-4 text-white" />
        </div>
        <h2 class="text-lg font-bold text-gray-900">{{ t.taskManagement }}</h2>
        <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-indigo-100">Agents</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="agent in taskAgents"
          :key="agent.action"
          class="group relative bg-white/80 backdrop-blur-sm border border-gray-100/80 rounded-2xl p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200/80 hover:-translate-y-0.5 transition-all duration-300"
        >
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div class="relative">
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5"
                :style="{ background: `linear-gradient(135deg, ${agent.color}18, ${agent.color}30)` }"
              >
                <UIcon :name="agent.icon" class="w-5 h-5" :style="{ color: agent.color }" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-900">{{ agent.name }}</p>
              </div>
            </div>
            <p class="text-xs text-gray-500 mb-3.5 leading-relaxed">{{ agent.description }}</p>
            <div class="flex gap-1.5 flex-wrap mb-3.5">
              <span
                v-for="tag in agent.tags"
                :key="tag"
                class="text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1"
                :style="{ backgroundColor: agent.color + '08', color: agent.color, boxShadow: `inset 0 0 0 1px ${agent.color}20` }"
              >
                {{ tag }}
              </span>
            </div>

            <!-- Optional user input for task_generator -->
            <div v-if="agent.action === 'agent_task_generator'" class="mb-3.5">
              <input
                v-model="taskAgentInput"
                type="text"
                :placeholder="lang.language.value === 'en' ? 'e.g. payment module, OAuth auth...' : 'Ej: módulo de pagos, auth con OAuth...'"
                class="w-full text-sm border border-gray-200/80 rounded-xl px-3.5 py-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all placeholder:text-gray-300"
              />
            </div>

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
                {{ t.running }}
              </span>
              <span v-else>{{ agent.action === 'agent_task_improver' ? t.improveTasks : agent.action === 'agent_workload_analyzer' ? t.analyzeLoad : t.execute }}</span>
            </button>

            <!-- Result -->
            <div v-if="agentResults[agent.action]" class="mt-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 space-y-2.5 ring-1 ring-gray-100">
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p class="text-xs font-bold text-gray-900">
                  {{ agentResults[agent.action].sprint_name || agentResults[agent.action].feature_summary || agentResults[agent.action].summary || (lang.language.value === 'en' ? 'Result' : 'Resultado') }}
                </p>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <span v-if="agentResults[agent.action].tasksCreated > 0" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  {{ agentResults[agent.action].tasksCreated }} {{ t.tasksCreated }}
                </span>
                <span v-if="agentResults[agent.action]._tasksImproved > 0" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  {{ agentResults[agent.action]._tasksImproved }} {{ t.tasksImproved }}
                </span>
                <span v-if="agentResults[agent.action].health_score" class="text-[10px] font-semibold px-2.5 py-1 rounded-full ring-1"
                  :class="agentResults[agent.action].health_score > 60 ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : agentResults[agent.action].health_score > 30 ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-red-50 text-red-700 ring-red-100'">
                  {{ t.health }} {{ agentResults[agent.action].health_score }}/100
                </span>
                <span v-if="agentResults[agent.action].velocity_estimate" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                  {{ agentResults[agent.action].velocity_estimate }}{{ t.estimatedHours }}
                </span>
              </div>

              <!-- Bottlenecks -->
              <div v-if="agentResults[agent.action].bottlenecks?.length" class="space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 text-amber-400" />
                  {{ t.bottlenecks }}
                </p>
                <div v-for="(b, bi) in agentResults[agent.action].bottlenecks.slice(0, 3)" :key="bi" class="flex items-start gap-2 text-[10px] text-gray-600 bg-white/70 rounded-lg p-2">
                  <span
                    class="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                    :class="b.severity === 'high' ? 'bg-red-500' : b.severity === 'medium' ? 'bg-amber-400' : 'bg-gray-300'"
                  ></span>
                  <span><span class="font-semibold" :class="b.severity === 'high' ? 'text-red-600' : b.severity === 'medium' ? 'text-amber-600' : 'text-gray-500'">{{ b.area }}:</span> {{ b.description }}</span>
                </div>
              </div>

              <!-- Recommendations -->
              <div v-if="agentResults[agent.action].recommendations?.length" class="space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UIcon name="i-heroicons-light-bulb" class="w-3.5 h-3.5 text-indigo-400" />
                  {{ t.recommendations }}
                </p>
                <div v-for="(r, ri) in (agentResults[agent.action].recommendations || []).slice(0, 3)" :key="ri" class="flex items-start gap-2 text-[10px] text-gray-600 bg-white/70 rounded-lg p-2">
                  <UIcon name="i-heroicons-arrow-right-circle" class="w-3 h-3 text-indigo-300 mt-0.5 shrink-0" />
                  <span>{{ typeof r === 'string' ? r : r.description }}</span>
                </div>
              </div>

              <!-- Created tasks -->
              <div v-if="agentResults[agent.action].createdTasks?.length" class="mt-3 pt-3 border-t border-gray-100">
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UIcon name="i-heroicons-clipboard-document-check" class="w-3.5 h-3.5 text-emerald-400" />
                  {{ t.tasksCreated }}
                </p>
                <div v-for="(task, ti) in agentResults[agent.action].createdTasks.slice(0, 4)" :key="ti" class="flex items-center gap-1.5 text-[10px] py-1">
                  <span
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold ring-1"
                    :class="task.priority === 'high' || task.priority === 'critical' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-gray-50 text-gray-600 ring-gray-100'"
                  >{{ task.priority }}</span>
                  <span class="text-gray-700 truncate">{{ task.title }}</span>
                </div>
                <p v-if="agentResults[agent.action].createdTasks.length > 4" class="text-[10px] text-gray-400 mt-1">
                  +{{ agentResults[agent.action].createdTasks.length - 4 }} {{ t.more }}
                </p>
              </div>
            </div>

            <div v-if="agentErrors[agent.action]" class="mt-3 bg-red-50 rounded-xl p-3 ring-1 ring-red-100 flex items-start gap-2">
              <UIcon name="i-heroicons-x-circle" class="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <p class="text-[10px] text-red-600">{{ agentErrors[agent.action] }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Divider -->
    <div v-if="canUseAI && canUseDocAgents" class="relative my-10">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200/60"></div>
      </div>
      <div class="relative flex justify-center">
        <div class="bg-white px-4 flex items-center gap-2">
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
        <h2 class="text-lg font-bold text-gray-900">{{ t.documentation }}</h2>
        <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 ring-1 ring-blue-100">Agents</span>
      </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="agent in agents"
        :key="agent.action"
        class="group relative bg-white/80 backdrop-blur-sm border border-gray-100/80 rounded-2xl p-5 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200/80 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
              <p class="text-sm font-bold text-gray-900">{{ agent.name }}</p>
              <p class="text-[10px] text-gray-400 font-mono">{{ agent.folder }}</p>
            </div>
          </div>

          <!-- Description -->
          <p class="text-xs text-gray-500 mb-3.5 leading-relaxed">{{ agent.description }}</p>

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
          <div v-if="agentResults[agent.action]" class="mt-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 space-y-2.5 ring-1 ring-gray-100">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p class="text-xs font-bold text-gray-900">{{ agentResults[agent.action].title }}</p>
            </div>
            <p class="text-[10px] text-gray-500 italic pl-6">{{ agentResults[agent.action].summary }}</p>

            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="agentResults[agent.action].tasksCreated > 0" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                {{ agentResults[agent.action].tasksCreated }} {{ t.tasks }}
              </span>
              <span v-if="agentResults[agent.action].savedFile" class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                {{ t.savedMd }}
              </span>
              <span v-if="agentResults[agent.action].sessionId" class="text-[10px] font-mono px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200">
                {{ agentResults[agent.action].sessionId.slice(0, 8) }}
              </span>
            </div>

            <!-- Sections preview -->
            <div v-if="agentResults[agent.action].sections?.length" class="space-y-1.5 mt-3 pt-3 border-t border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <UIcon name="i-heroicons-list-bullet" class="w-3.5 h-3.5 text-blue-400" />
                {{ t.sections }}
              </p>
              <div v-for="(section, si) in agentResults[agent.action].sections.slice(0, 4)" :key="si" class="flex items-center gap-2 text-[10px] text-gray-600 bg-white/70 rounded-lg p-2">
                <span class="w-5 h-5 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center text-[9px] font-bold shrink-0">{{ Number(si) + 1 }}</span>
                {{ section.heading }}
              </div>
              <p v-if="(agentResults[agent.action].sections as any[]).length > 4" class="text-[10px] text-gray-400 pl-7">
                +{{ (agentResults[agent.action].sections as any[]).length - 4 }} {{ t.more }}
              </p>
            </div>

            <!-- Created tasks -->
            <div v-if="agentResults[agent.action].createdTasks?.length" class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UIcon name="i-heroicons-clipboard-document-check" class="w-3.5 h-3.5 text-emerald-400" />
                {{ t.tasksCreated }}
              </p>
              <div v-for="(task, ti) in agentResults[agent.action].createdTasks.slice(0, 3)" :key="ti" class="flex items-center gap-1.5 text-[10px] py-1">
                <span
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold ring-1"
                  :class="task.priority === 'high' || task.priority === 'critical' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-gray-50 text-gray-600 ring-gray-100'"
                >{{ task.priority }}</span>
                <span class="text-gray-700 truncate">{{ task.title }}</span>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-if="agentErrors[agent.action]" class="mt-3 bg-red-50 rounded-xl p-3 ring-1 ring-red-100 flex items-start gap-2">
            <UIcon name="i-heroicons-x-circle" class="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <p class="text-[10px] text-red-600">{{ agentErrors[agent.action] }}</p>
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

const taskAgentInput = ref('')

const taskAgents = computed(() => {
  const en = lang.language.value === 'en'
  return [
    {
      action: 'agent_sprint_planner',
      name: 'Sprint Planner',
      description: en ? 'Analyzes tasks, prioritizes and generates an organized sprint plan with new tasks.' : 'Analiza tareas, prioriza y genera un plan de sprint con tareas nuevas organizadas.',
      icon: 'i-heroicons-calendar-days',
      color: '#6366F1',
      tags: en ? ['sprint', 'planning'] : ['sprint', 'planificación'],
    },
    {
      action: 'agent_task_generator',
      name: 'Task Generator (Context7)',
      description: en ? 'Generates detailed technical tasks using real framework documentation via Context7.' : 'Genera tareas técnicas detalladas usando documentación real de frameworks vía Context7.',
      icon: 'i-heroicons-queue-list',
      color: '#0EA5E9',
      tags: en ? ['tasks', 'context7'] : ['tareas', 'context7'],
    },
    {
      action: 'agent_workload_analyzer',
      name: 'Workload Analyzer',
      description: en ? 'Detects bottlenecks, stalled tasks and workload imbalances between members.' : 'Detecta cuellos de botella, tareas estancadas y desbalances de carga entre miembros.',
      icon: 'i-heroicons-chart-bar',
      color: '#F97316',
      tags: en ? ['analysis', 'workload'] : ['análisis', 'carga'],
    },
    {
      action: 'agent_task_improver',
      name: 'Bulk Task Improver',
      description: en ? 'Improves titles, descriptions, estimates and adds acceptance criteria to tasks.' : 'Mejora títulos, descripciones, estimaciones y agrega criterios de aceptación a las tareas.',
      icon: 'i-heroicons-arrow-trending-up',
      color: '#14B8A6',
      tags: en ? ['improvement', 'quality'] : ['mejora', 'calidad'],
    },
  ]
})

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

const projectOptions = computed(() =>
  (store.projects || []).map(p => ({ label: p.name, value: p.id }))
)

async function runAgent(action: string) {
  if (!selectedProjectId.value || agentRunning.value) return

  agentRunning.value = action
  agentErrors.value[action] = ''

  try {
    const context: Record<string, any> = { projectId: selectedProjectId.value }
    // Pass user input for task_generator agent
    if (action === 'agent_task_generator' && taskAgentInput.value.trim()) {
      context.userInput = taskAgentInput.value.trim()
    }

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
