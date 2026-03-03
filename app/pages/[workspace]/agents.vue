<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">AI Agents</h1>
        <p class="text-sm text-gray-500 mt-1">Agentes de gestión de tareas y documentación con memoria por sesión</p>
      </div>
    </div>

    <!-- Project selector -->
    <div class="mb-6 max-w-xs">
      <label class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Proyecto</label>
      <USelectMenu
        v-model="selectedProjectId"
        :items="projectOptions"
        value-key="value"
        placeholder="Selecciona un proyecto..."
        class="w-full"
      />
    </div>

    <div v-if="!selectedProjectId" class="text-center py-16">
      <UIcon name="i-heroicons-cpu-chip" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-sm text-gray-400">Selecciona un proyecto para ejecutar los agentes</p>
    </div>

    <template v-else>
    <!-- Task Management Agents -->
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-queue-list" class="w-5 h-5 text-gray-400" />
        <h2 class="text-lg font-bold text-gray-900">Gestión de Tareas</h2>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">Agents</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="agent in taskAgents"
          :key="agent.action"
          class="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :style="{ backgroundColor: agent.color + '20' }"
            >
              <UIcon :name="agent.icon" class="w-5 h-5" :style="{ color: agent.color }" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900">{{ agent.name }}</p>
            </div>
          </div>
          <p class="text-xs text-gray-600 mb-3 leading-relaxed">{{ agent.description }}</p>
          <div class="flex gap-1.5 flex-wrap mb-3">
            <span
              v-for="tag in agent.tags"
              :key="tag"
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              :style="{ backgroundColor: agent.color + '15', color: agent.color }"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Optional user input for task_generator -->
          <div v-if="agent.action === 'agent_task_generator'" class="mb-3">
            <input
              v-model="taskAgentInput"
              type="text"
              placeholder="Ej: módulo de pagos, auth con OAuth..."
              class="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          <button
            class="w-full text-center py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            :style="{
              backgroundColor: agentRunning === agent.action ? agent.color + '10' : agent.color + '15',
              color: agent.color,
            }"
            :disabled="!!agentRunning"
            @click="runAgent(agent.action)"
          >
            <span v-if="agentRunning === agent.action" class="flex items-center justify-center gap-1.5">
              <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
              Ejecutando...
            </span>
            <span v-else>{{ agent.action === 'agent_task_improver' ? 'Mejorar tareas' : agent.action === 'agent_workload_analyzer' ? 'Analizar carga' : 'Ejecutar' }}</span>
          </button>

          <!-- Result -->
          <div v-if="agentResults[agent.action]" class="mt-4 bg-gray-50 rounded-xl p-3 space-y-2">
            <p class="text-xs font-bold text-gray-900">
              {{ agentResults[agent.action].sprint_name || agentResults[agent.action].feature_summary || agentResults[agent.action].summary || 'Resultado' }}
            </p>

            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="agentResults[agent.action].tasksCreated > 0" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {{ agentResults[agent.action].tasksCreated }} tareas creadas
              </span>
              <span v-if="agentResults[agent.action]._tasksImproved > 0" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                {{ agentResults[agent.action]._tasksImproved }} tareas mejoradas
              </span>
              <span v-if="agentResults[agent.action].health_score" class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                :class="agentResults[agent.action].health_score > 60 ? 'bg-emerald-50 text-emerald-700' : agentResults[agent.action].health_score > 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">
                Salud: {{ agentResults[agent.action].health_score }}/100
              </span>
              <span v-if="agentResults[agent.action].velocity_estimate" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {{ agentResults[agent.action].velocity_estimate }}h estimadas
              </span>
            </div>

            <!-- Bottlenecks -->
            <div v-if="agentResults[agent.action].bottlenecks?.length" class="space-y-1 mt-2">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuellos de botella</p>
              <div v-for="(b, bi) in agentResults[agent.action].bottlenecks.slice(0, 3)" :key="bi" class="text-[10px] text-gray-600">
                <span class="font-semibold" :class="b.severity === 'high' ? 'text-red-600' : b.severity === 'medium' ? 'text-amber-600' : 'text-gray-500'">{{ b.area }}:</span>
                {{ b.description }}
              </div>
            </div>

            <!-- Recommendations -->
            <div v-if="agentResults[agent.action].recommendations?.length" class="space-y-1 mt-2">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recomendaciones</p>
              <div v-for="(r, ri) in (agentResults[agent.action].recommendations || []).slice(0, 3)" :key="ri" class="text-[10px] text-gray-600">
                {{ typeof r === 'string' ? r : r.description }}
              </div>
            </div>

            <!-- Created tasks -->
            <div v-if="agentResults[agent.action].createdTasks?.length" class="mt-2">
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tareas creadas</p>
              <div v-for="(task, ti) in agentResults[agent.action].createdTasks.slice(0, 4)" :key="ti" class="flex items-center gap-1.5 text-[10px]">
                <span
                  class="px-1 py-0.5 rounded text-[9px] font-bold"
                  :class="task.priority === 'high' || task.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'"
                >{{ task.priority }}</span>
                <span class="text-gray-700 truncate">{{ task.title }}</span>
              </div>
              <p v-if="agentResults[agent.action].createdTasks.length > 4" class="text-[10px] text-gray-400 mt-0.5">
                +{{ agentResults[agent.action].createdTasks.length - 4 }} más...
              </p>
            </div>
          </div>

          <div v-if="agentErrors[agent.action]" class="mt-3 bg-red-50 rounded-lg p-2">
            <p class="text-[10px] text-red-600">{{ agentErrors[agent.action] }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Documentation Agents -->
    <div>
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-400" />
        <h2 class="text-lg font-bold text-gray-900">Documentación</h2>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Agents</span>
      </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="agent in agents"
        :key="agent.action"
        class="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
      >
        <!-- Agent header -->
        <div class="flex items-center gap-3 mb-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :style="{ backgroundColor: agent.color + '20' }"
          >
            <UIcon :name="agent.icon" class="w-5 h-5" :style="{ color: agent.color }" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900">{{ agent.name }}</p>
            <p class="text-[10px] text-gray-400">{{ agent.folder }}</p>
          </div>
        </div>

        <!-- Description -->
        <p class="text-xs text-gray-600 mb-3 leading-relaxed">{{ agent.description }}</p>

        <!-- Tags -->
        <div class="flex gap-1.5 flex-wrap mb-4">
          <span
            v-for="tag in agent.tags"
            :key="tag"
            class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            :style="{ backgroundColor: agent.color + '15', color: agent.color }"
          >
            {{ tag }}
          </span>
        </div>

        <!-- Action button -->
        <button
          class="w-full text-center py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          :style="{
            backgroundColor: agentRunning === agent.action ? agent.color + '10' : agent.color + '15',
            color: agent.color,
          }"
          :disabled="!!agentRunning"
          @click="runAgent(agent.action)"
        >
          <span v-if="agentRunning === agent.action" class="flex items-center justify-center gap-1.5">
            <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            Generando...
          </span>
          <span v-else>Generar documentación</span>
        </button>

        <!-- Result -->
        <div v-if="agentResults[agent.action]" class="mt-4 bg-gray-50 rounded-xl p-3 space-y-2">
          <p class="text-xs font-bold text-gray-900">{{ agentResults[agent.action].title }}</p>
          <p class="text-[10px] text-gray-600 italic">{{ agentResults[agent.action].summary }}</p>

          <div class="flex items-center gap-2 flex-wrap">
            <span v-if="agentResults[agent.action].tasksCreated > 0" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {{ agentResults[agent.action].tasksCreated }} tareas
            </span>
            <span v-if="agentResults[agent.action].savedFile" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              .md guardado
            </span>
            <span v-if="agentResults[agent.action].sessionId" class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {{ agentResults[agent.action].sessionId.slice(0, 8) }}
            </span>
          </div>

          <!-- Sections preview -->
          <div v-if="agentResults[agent.action].sections?.length" class="space-y-1 mt-2">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Secciones</p>
            <div v-for="(section, si) in agentResults[agent.action].sections.slice(0, 4)" :key="si" class="text-[10px] text-gray-600">
              {{ Number(si) + 1 }}. {{ section.heading }}
            </div>
            <p v-if="(agentResults[agent.action].sections as any[]).length > 4" class="text-[10px] text-gray-400">
              +{{ (agentResults[agent.action].sections as any[]).length - 4 }} más...
            </p>
          </div>

          <!-- Created tasks -->
          <div v-if="agentResults[agent.action].createdTasks?.length" class="mt-2">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tareas creadas</p>
            <div v-for="(task, ti) in agentResults[agent.action].createdTasks.slice(0, 3)" :key="ti" class="flex items-center gap-1.5 text-[10px]">
              <span
                class="px-1 py-0.5 rounded text-[9px] font-bold"
                :class="task.priority === 'high' || task.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'"
              >{{ task.priority }}</span>
              <span class="text-gray-700 truncate">{{ task.title }}</span>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="agentErrors[agent.action]" class="mt-3 bg-red-50 rounded-lg p-2">
          <p class="text-[10px] text-red-600">{{ agentErrors[agent.action] }}</p>
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

const taskAgentInput = ref('')

const taskAgents = [
  {
    action: 'agent_sprint_planner',
    name: 'Sprint Planner',
    description: 'Analiza tareas, prioriza y genera un plan de sprint con tareas nuevas organizadas.',
    icon: 'i-heroicons-calendar-days',
    color: '#6366F1',
    tags: ['sprint', 'planificación'],
  },
  {
    action: 'agent_task_generator',
    name: 'Task Generator (Context7)',
    description: 'Genera tareas técnicas detalladas usando documentación real de frameworks vía Context7.',
    icon: 'i-heroicons-queue-list',
    color: '#0EA5E9',
    tags: ['tareas', 'context7'],
  },
  {
    action: 'agent_workload_analyzer',
    name: 'Workload Analyzer',
    description: 'Detecta cuellos de botella, tareas estancadas y desbalances de carga entre miembros.',
    icon: 'i-heroicons-chart-bar',
    color: '#F97316',
    tags: ['análisis', 'carga'],
  },
  {
    action: 'agent_task_improver',
    name: 'Bulk Task Improver',
    description: 'Mejora títulos, descripciones, estimaciones y agrega criterios de aceptación a las tareas.',
    icon: 'i-heroicons-arrow-trending-up',
    color: '#14B8A6',
    tags: ['mejora', 'calidad'],
  },
]

const agents = [
  {
    action: 'doc_backend_architecture',
    name: 'Backend Senior Architecture',
    description: 'Genera documentación detallada de arquitectura backend: APIs, modelos de datos, patrones de diseño, seguridad y testing.',
    icon: 'i-heroicons-server-stack',
    color: '#3B82F6',
    folder: '/docs/backend',
    tags: ['backend', 'arquitectura'],
  },
  {
    action: 'doc_aws_expert',
    name: 'AWS Senior Expert',
    description: 'Documenta infraestructura AWS: servicios, configuración, costos, seguridad, escalabilidad y disaster recovery.',
    icon: 'i-heroicons-cloud',
    color: '#F59E0B',
    folder: '/docs/aws',
    tags: ['aws', 'cloud', 'infra'],
  },
  {
    action: 'doc_frontend_design',
    name: 'Frontend Design (Context7)',
    description: 'Genera guías de diseño frontend con documentación real de Vue, Nuxt, Tailwind y Pinia vía Context7 API.',
    icon: 'i-heroicons-paint-brush',
    color: '#EC4899',
    folder: '/docs/frontend',
    tags: ['frontend', 'diseño', 'ui'],
  },
  {
    action: 'doc_marketing',
    name: 'Marketing Documentation',
    description: 'Crea documentación de estrategia de marketing: audiencia, canales, contenido, métricas y roadmap de crecimiento.',
    icon: 'i-heroicons-megaphone',
    color: '#8B5CF6',
    folder: '/docs/marketing',
    tags: ['marketing', 'estrategia'],
  },
  {
    action: 'doc_ai_agents',
    name: 'AI Agents Documentation',
    description: 'Documenta el sistema de agentes AI: prompts, flujos, modelos, embeddings, memoria y optimización.',
    icon: 'i-heroicons-cpu-chip',
    color: '#10B981',
    folder: '/docs/agents',
    tags: ['ai', 'agentes', 'prompts'],
  },
]

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
      agentErrors.value[action] = 'Respuesta inesperada del agente'
    }
  } catch (e: any) {
    agentErrors.value[action] = e.data?.message || e.message || 'Error al ejecutar agente'
  } finally {
    agentRunning.value = null
  }
}
</script>
