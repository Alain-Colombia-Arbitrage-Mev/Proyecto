<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">AI Agents</h1>
        <p class="text-sm text-gray-500 mt-1">Agentes especializados de documentación con memoria por sesión</p>
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

    <!-- Agents Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()

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
    const res = await $fetch<{ type: string; data: any }>('/api/ai/assist', {
      method: 'POST',
      body: {
        action,
        context: { projectId: selectedProjectId.value },
      },
    })

    if (res?.type === 'json' && res.data?.title) {
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
