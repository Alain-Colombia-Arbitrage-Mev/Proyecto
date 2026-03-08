<template>
  <UModal v-model:open="isOpen" class="sm:max-w-lg w-full">
    <template #content>
      <div class="bg-white dark:bg-[#1b1b1b] p-6">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white">{{ lang.language.value === 'en' ? 'Delegate to AI Agent' : 'Delegar a Agente AI' }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ taskTitle }}</p>
          </div>
        </div>

        <!-- Agent selection -->
        <div class="mb-5">
          <label class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
            {{ lang.language.value === 'en' ? 'Select Agent' : 'Seleccionar Agente' }}
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="agent in agents"
              :key="agent.id"
              class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer"
              :class="selectedAgent === agent.id
                ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10'
                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'"
              @click="selectedAgent = agent.id"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" :class="agent.bgClass">
                <UIcon :name="agent.icon" class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold truncate" :class="selectedAgent === agent.id ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'">{{ agent.name }}</p>
                <p class="text-[10px] text-gray-400 dark:text-gray-500 truncate">{{ agent.desc }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Decompose toggle -->
        <div class="mb-5 flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ lang.language.value === 'en' ? 'Decompose into subtasks' : 'Descomponer en subtareas' }}</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ lang.language.value === 'en' ? 'AI will create subtasks automatically' : 'La AI creara subtareas automaticamente' }}</p>
          </div>
          <button
            class="w-10 h-6 rounded-full transition-colors relative cursor-pointer"
            :class="decompose ? 'bg-purple-500' : 'bg-gray-300 dark:bg-white/20'"
            @click="decompose = !decompose"
          >
            <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" :class="decompose ? 'translate-x-[18px]' : 'translate-x-0.5'" />
          </button>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="isOpen = false">{{ lang.language.value === 'en' ? 'Cancel' : 'Cancelar' }}</UButton>
          <UButton color="primary" :loading="delegating" :disabled="!selectedAgent" @click="handleDelegate" class="bg-purple-600 hover:bg-purple-700">
            <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 mr-1" />
            {{ lang.language.value === 'en' ? 'Delegate' : 'Delegar' }}
          </UButton>
        </div>

        <!-- Result -->
        <div v-if="result" class="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <p class="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {{ lang.language.value === 'en' ? `Delegated to ${result.agent}` : `Delegado a ${result.agent}` }}
            <span v-if="result.subtasks_created"> — {{ result.subtasks_created }} {{ lang.language.value === 'en' ? 'subtasks created' : 'subtareas creadas' }}</span>
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const lang = useLanguage()

const props = defineProps<{
  open: boolean
  taskId: string
  taskTitle: string
  workspaceId: string
  projectId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  delegated: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const agents = [
  { id: 'backend', name: 'Backend', desc: 'APIs, DB, Auth', icon: 'i-heroicons-server-stack', bgClass: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  { id: 'frontend', name: 'Frontend', desc: 'UI, Components', icon: 'i-heroicons-paint-brush', bgClass: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400' },
  { id: 'qa', name: 'QA', desc: 'Testing, Bugs', icon: 'i-heroicons-bug-ant', bgClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  { id: 'devops', name: 'DevOps', desc: 'CI/CD, Infra', icon: 'i-heroicons-cloud', bgClass: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
  { id: 'designer', name: 'Designer', desc: 'UI/UX, Mockups', icon: 'i-heroicons-swatch', bgClass: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' },
  { id: 'copywriter', name: 'Copywriter', desc: 'Docs, Content', icon: 'i-heroicons-pencil-square', bgClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  { id: 'data', name: 'Data', desc: 'Analytics, Reports', icon: 'i-heroicons-chart-bar', bgClass: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  { id: 'security', name: 'Security', desc: 'Audit, Hardening', icon: 'i-heroicons-shield-check', bgClass: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' },
]

const selectedAgent = ref('')
const decompose = ref(true)
const delegating = ref(false)
const result = ref<{ agent: string; subtasks_created: number } | null>(null)

async function handleDelegate() {
  if (!selectedAgent.value) return
  delegating.value = true
  result.value = null

  try {
    const res = await $fetch<any>(`/api/workspaces/${props.workspaceId}/orchestrator`, {
      method: 'POST',
      body: {
        task_id: props.taskId,
        project_id: props.projectId,
        auto_delegate: decompose.value,
      },
    })

    // Also set the ai_agent on the task
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}`, {
      method: 'PATCH',
      body: { ai_agent: selectedAgent.value },
    })

    result.value = {
      agent: selectedAgent.value,
      subtasks_created: res.tasks_created || 0,
    }

    setTimeout(() => {
      isOpen.value = false
      emit('delegated')
    }, 1500)
  } catch (e: any) {
    console.error('[delegate] Error:', e)
  } finally {
    delegating.value = false
  }
}

watch(isOpen, (v) => {
  if (v) {
    selectedAgent.value = ''
    decompose.value = true
    result.value = null
  }
})
</script>
