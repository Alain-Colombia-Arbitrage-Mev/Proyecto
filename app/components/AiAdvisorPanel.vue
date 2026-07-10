<template>
  <div>
    <!-- Floating trigger -->
    <button
      v-if="!open"
      class="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-focusflow-500 to-teal-500 text-white shadow-lg shadow-focusflow-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      :title="t.aiAdvisor"
      @click="open = true"
    >
      <UIcon name="i-heroicons-sparkles" class="w-5 h-5" />
    </button>

    <!-- Panel -->
    <Teleport to="body">
      <Transition name="advisor-slide">
        <div
          v-if="open"
          class="fixed z-[120] inset-x-0 bottom-0 md:inset-x-auto md:right-6 md:bottom-6 md:w-[400px] md:max-h-[600px] h-[75vh] md:h-[560px] bg-white dark:bg-[#161616] md:rounded-2xl rounded-t-2xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-gradient-to-r from-focusflow-500/10 to-teal-500/10 shrink-0">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-focusflow-500 to-teal-500 flex items-center justify-center text-white shrink-0">
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ t.aiAdvisor }}</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">DeepSeek V4 Pro · {{ teamTypeLabel }}</p>
            </div>
            <button
              class="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              @click="open = false"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>

          <!-- Messages -->
          <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
                :class="msg.role === 'user'
                  ? 'bg-focusflow-500 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 rounded-bl-md'"
              >{{ msg.text }}</div>
            </div>
            <div v-if="loading" class="flex justify-start">
              <div class="bg-gray-100 dark:bg-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span v-for="d in 3" :key="d" class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" :style="{ animationDelay: `${d * 120}ms` }" />
              </div>
            </div>
          </div>

          <!-- Plan-from-document mode -->
          <div v-if="planMode" class="p-3 border-t border-gray-100 dark:border-white/[0.06] space-y-2 shrink-0 bg-gray-50/60 dark:bg-white/[0.02]">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5" />
                {{ es ? 'Plan desde documento' : 'Plan from document' }}
                <span class="text-focusflow-500 font-semibold normal-case tracking-normal">· GLM-5.2</span>
              </p>
              <button class="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline cursor-pointer" @click="planMode = false">
                {{ es ? 'Volver al chat' : 'Back to chat' }}
              </button>
            </div>
            <select
              v-model="planProjectId"
              class="w-full bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-gray-900 dark:text-gray-100 focus:outline-none"
            >
              <option value="" disabled>{{ es ? 'Selecciona proyecto destino…' : 'Select target project…' }}</option>
              <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <textarea
              v-model="planDoc"
              rows="5"
              :placeholder="es ? 'Pega aquí la documentación detallada o el plan… (o sube un archivo)' : 'Paste detailed documentation or the plan here… (or upload a file)'"
              class="w-full bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-[12px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-focusflow-400/50 resize-none"
            />
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:border-focusflow-300 cursor-pointer transition-colors">
                <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5" />
                {{ es ? 'Subir archivo' : 'Upload file' }}
                <input type="file" accept=".md,.txt,.markdown,.csv,.json" class="hidden" @change="onPlanFile">
              </label>
              <span v-if="planDoc" class="text-[10px] text-gray-400 tabular-nums">{{ Math.round(planDoc.length / 1000) }}k chars</span>
              <button
                class="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-focusflow-500 hover:bg-focusflow-600 disabled:opacity-40 text-white text-[11px] font-bold transition-colors cursor-pointer"
                :disabled="planLoading || !planProjectId || planDoc.trim().length < 30"
                @click="generatePlan"
              >
                <UIcon :name="planLoading ? 'i-heroicons-arrow-path' : 'i-heroicons-sparkles'" class="w-3.5 h-3.5" :class="{ 'animate-spin': planLoading }" />
                {{ planLoading ? (es ? 'Planificando…' : 'Planning…') : (es ? 'Generar tareas' : 'Generate tasks') }}
              </button>
            </div>
          </div>

          <!-- Input -->
          <form v-else class="p-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2 shrink-0" @submit.prevent="send">
            <button
              type="button"
              class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] hover:bg-focusflow-50 dark:hover:bg-focusflow-500/10 text-gray-500 dark:text-gray-400 hover:text-focusflow-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              :title="es ? 'Crear tareas desde un documento o plan (GLM-5.2)' : 'Create tasks from a document or plan (GLM-5.2)'"
              @click="openPlanMode"
            >
              <UIcon name="i-heroicons-document-plus" class="w-4 h-4" />
            </button>
            <input
              v-model="input"
              type="text"
              :placeholder="t.advisorPlaceholder"
              class="flex-1 min-w-0 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-focusflow-400/50"
              :disabled="loading"
            />
            <button
              type="submit"
              class="w-10 h-10 rounded-xl bg-focusflow-500 hover:bg-focusflow-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              :disabled="loading || !input.trim()"
            >
              <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
            </button>
          </form>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const store = useWorkspaceStore()
const lang = useLanguage()
const { labels: t } = lang

const open = ref(false)
const input = ref('')
const loading = ref(false)
const scrollEl = ref<HTMLElement | null>(null)

// Plan-from-document mode (long-context model)
const planMode = ref(false)
const planProjectId = ref('')
const planDoc = ref('')
const planLoading = ref(false)

const es = computed(() => lang.language.value !== 'en')

function openPlanMode() {
  planMode.value = true
  if (!store.projectsLoaded) store.loadProjects()
}

function onPlanFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    planDoc.value = String(reader.result || '')
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function generatePlan() {
  if (!store.workspace?.id || !planProjectId.value || planDoc.value.trim().length < 30 || planLoading.value) return
  planLoading.value = true
  try {
    const res = await $fetch<{ summary: string; tasks_created: number; project: string; column: string; tasks: any[] }>(
      `/api/workspaces/${store.workspace.id}/plan-from-doc`,
      { method: 'POST', body: { project_id: planProjectId.value, document: planDoc.value } },
    )
    const taskList = (res.tasks || []).map((t: any) => `• ${t.title}${t.ai_agent ? ` → ${t.ai_agent}` : ''}`).join('\n')
    messages.value.push({
      role: 'assistant',
      text: es.value
        ? `📋 Plan generado: ${res.tasks_created} tareas creadas en "${res.project}" (columna ${res.column}).\n\n${res.summary}\n\n${taskList}`
        : `📋 Plan generated: ${res.tasks_created} tasks created in "${res.project}" (column ${res.column}).\n\n${res.summary}\n\n${taskList}`,
    })
    planDoc.value = ''
    planMode.value = false
  } catch (e: any) {
    messages.value.push({
      role: 'assistant',
      text: e.data?.message || (es.value ? 'No se pudo generar el plan. Intenta de nuevo.' : 'Could not generate the plan. Try again.'),
    })
  } finally {
    planLoading.value = false
    await scrollToBottom()
  }
}

interface AdvisorMessage { role: 'user' | 'assistant'; text: string }
const messages = ref<AdvisorMessage[]>([])

const teamTypeLabel = computed(() => {
  const map: Record<string, string> = {
    kanban: t.value.teamTypeKanban,
    scrum: t.value.teamTypeScrum,
    dev: t.value.teamTypeDev,
    audio: t.value.teamTypeAudio,
    creative: t.value.teamTypeCreative,
  }
  return map[(store.workspace as any)?.team_type || 'kanban']
})

watch(open, (isOpen) => {
  if (isOpen && messages.value.length === 0) {
    messages.value.push({ role: 'assistant', text: t.value.advisorIntro })
  }
})

async function scrollToBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

async function send() {
  const message = input.value.trim()
  if (!message || loading.value || !store.workspace?.id) return

  messages.value.push({ role: 'user', text: message })
  input.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const res = await $fetch<{ type: string; data: any }>('/api/ai/assist', {
      method: 'POST',
      body: {
        action: 'advisor',
        context: {
          workspaceId: store.workspace.id,
          lang: lang.language.value,
          message,
          // Skip the intro message; only send real conversation turns
          history: messages.value.slice(1, -1).slice(-12),
        },
      },
    })
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    messages.value.push({ role: 'assistant', text })
  } catch (e: any) {
    messages.value.push({
      role: 'assistant',
      text: e.data?.message || e.message || (lang.language.value === 'en' ? 'Something went wrong. Try again.' : 'Algo salió mal. Intenta de nuevo.'),
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.advisor-slide-enter-active,
.advisor-slide-leave-active {
  transition: all 0.25s ease;
}
.advisor-slide-enter-from,
.advisor-slide-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
