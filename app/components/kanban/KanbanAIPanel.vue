<template>
  <!-- AI Floating Button -->
  <button
    class="fixed bottom-20 md:bottom-6 right-6 w-12 h-12 rounded-full bg-focusflow-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-focusflow-700 hover:scale-105 transition-all duration-200 z-50 cursor-pointer"
    @click="showAiPanel = !showAiPanel"
  >
    <UIcon :name="showAiPanel ? 'i-heroicons-x-mark' : 'i-heroicons-sparkles'" class="w-5 h-5" />
  </button>

  <!-- AI Chat Panel -->
  <transition name="slide">
    <div
      v-if="showAiPanel"
      class="fixed bottom-36 md:bottom-20 inset-x-4 md:inset-x-auto md:right-6 w-auto md:w-96 max-h-[560px] bg-white dark:bg-[#1b1b1b] border border-gray-100 dark:border-white/10 rounded-2xl shadow-card-lg z-50 flex flex-col overflow-hidden"
    >
      <!-- Panel header -->
      <div class="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-focusflow-600 flex items-center justify-center">
          <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold text-gray-900 dark:text-gray-100">FocusFlow AI</p>
          <p class="text-[10px] text-gray-400">MiniMax M2.5 · {{ language === 'en' ? 'Smart assistant' : 'Asistente inteligente' }}</p>
        </div>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          @click="showAiPanel = false"
          :title="t.close"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="px-3 py-1.5 border-b border-gray-100 dark:border-white/10 flex gap-1">
        <button
          class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          :class="aiTab === 'chat' ? 'bg-focusflow-50 dark:bg-focusflow-500/10 text-focusflow-700 dark:text-focusflow-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
          @click="aiTab = 'chat'"
        >Chat</button>
        <button
          class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          :class="aiTab === 'memory' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
          @click="aiTab = 'memory'; loadMemoryAgents()"
        >{{ language === 'en' ? 'Memory' : 'Memoria' }}</button>
        <button
          class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          :class="aiTab === 'tokens' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
          @click="aiTab = 'tokens'; loadTokenUsage()"
        >Tokens</button>
      </div>

      <!-- Quick actions (chat tab) -->
      <div v-if="aiTab === 'chat'" class="px-3 py-2 border-b border-gray-100 dark:border-white/10 flex gap-1.5 flex-wrap">
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-focusflow-50 text-focusflow-700 hover:bg-focusflow-100 transition-colors cursor-pointer" @click="handleSuggestTasks" :disabled="aiLoading">
          {{ language === 'en' ? 'Suggest tasks' : 'Sugerir tareas' }}
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer" @click="handleDailyPlan" :disabled="aiLoading">
          {{ t.dailyPlan }}
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer" @click="handleAntiProcrastination" :disabled="aiLoading">
          {{ t.antiProcrastination }}
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer" @click="handleDocumentArchitecture" :disabled="aiLoading">
          {{ language === 'en' ? 'Document Architecture' : 'Documentar Arquitectura' }}
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #3B82F620; color: #3B82F6;" @click="handleDocAgent('doc_backend_architecture')" :disabled="aiLoading">
          Backend Arch
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #F59E0B20; color: #F59E0B;" @click="handleDocAgent('doc_aws_expert')" :disabled="aiLoading">
          AWS Expert
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #EC489920; color: #EC4899;" @click="handleDocAgent('doc_frontend_design')" :disabled="aiLoading">
          Frontend Design
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #8B5CF620; color: #8B5CF6;" @click="handleDocAgent('doc_marketing')" :disabled="aiLoading">
          Marketing
        </button>
        <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #10B98120; color: #10B981;" @click="handleDocAgent('doc_ai_agents')" :disabled="aiLoading">
          AI Agents Doc
        </button>
      </div>

      <!-- Memory Tab -->
      <div v-if="aiTab === 'memory'" class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
        <div v-if="memoryLoading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <template v-else>
          <div v-if="memoryAgents.length === 0" class="text-center py-8">
            <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p class="text-xs text-gray-400">{{ language === 'en' ? 'No memories yet. Use the chat to generate context.' : 'Sin memorias aún. Usa el chat para generar contexto.' }}</p>
          </div>
          <div v-for="agent in memoryAgents" :key="agent.type" class="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center" :style="{ backgroundColor: agent.color + '20' }">
                <UIcon :name="agent.icon" class="w-3.5 h-3.5" :style="{ color: agent.color }" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-gray-900 dark:text-gray-100">{{ agent.name }}</p>
                <p class="text-[10px] text-gray-400">{{ agent.description }}</p>
              </div>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                :style="{ backgroundColor: agent.color + '20', color: agent.color }"
              >
                {{ agent.count }}
              </span>
            </div>
          </div>
          <div class="text-center pt-2">
            <p class="text-[10px] text-gray-400">Total: {{ memoryTotalCount }} {{ language === 'en' ? 'vector memories' : 'memorias vectoriales' }}</p>
          </div>
        </template>
      </div>

      <!-- Tokens Tab -->
      <div v-if="aiTab === 'tokens'" class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
        <div v-if="tokenLoading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <template v-else-if="tokenStats">
          <!-- Monthly usage bar -->
          <div class="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">{{ language === 'en' ? 'Monthly usage' : 'Uso mensual' }}</p>
              <span class="text-xs font-bold tabular-nums" :class="tokenStats.percentUsed >= 90 ? 'text-red-600' : tokenStats.percentUsed >= 70 ? 'text-amber-600' : 'text-emerald-600'">
                {{ tokenStats.percentUsed }}%
              </span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-1.5">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="tokenStats.percentUsed >= 90 ? 'bg-red-500' : tokenStats.percentUsed >= 70 ? 'bg-amber-500' : 'bg-emerald-500'"
                :style="{ width: `${Math.min(tokenStats.percentUsed, 100)}%` }"
              />
            </div>
            <p class="text-[10px] text-gray-500 dark:text-[#99a0ae]">{{ formatTokens(tokenStats.totalTokens) }} / {{ formatTokens(tokenStats.limit) }} tokens</p>
          </div>

          <!-- Today stats -->
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center">
              <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">{{ t.today }}</p>
              <span class="text-lg font-bold text-emerald-700 tabular-nums">{{ formatTokens(tokenTodayCount) }}</span>
            </div>
            <div class="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{{ t.thisMonth }}</p>
              <span class="text-lg font-bold text-gray-700 dark:text-gray-300 tabular-nums">{{ formatTokens(tokenStats.totalTokens) }}</span>
            </div>
          </div>

          <!-- By action breakdown -->
          <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{{ language === 'en' ? 'By action' : 'Por acción' }}</p>
            <div class="space-y-1.5">
              <div v-for="(tokens, actionName) in tokenStats.byAction" :key="actionName" class="flex items-center gap-2">
                <span class="text-[10px] text-gray-600 dark:text-[#99a0ae] w-24 truncate">{{ actionName }}</span>
                <div class="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full" :style="{ width: `${(tokens / tokenStats.totalTokens) * 100}%` }" />
                </div>
                <span class="text-[10px] text-gray-500 dark:text-[#99a0ae] tabular-nums w-14 text-right">{{ formatTokens(tokens) }}</span>
              </div>
            </div>
          </div>

          <!-- Avg tokens per message -->
          <div class="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3 text-center">
            <p class="text-[10px] text-violet-600 font-bold uppercase tracking-wider mb-1">{{ t.avgPerCall }}</p>
            <span class="text-lg font-bold text-violet-700 tabular-nums">{{ formatTokens(tokenAvgPerCall) }}</span>
            <p class="text-[10px] text-violet-500">{{ language === 'en' ? 'tokens/call' : 'tokens/llamada' }}</p>
          </div>
        </template>
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p class="text-xs text-gray-400">{{ language === 'en' ? 'No token usage data' : 'Sin datos de uso de tokens' }}</p>
        </div>
      </div>

      <!-- Messages (chat tab) -->
      <div v-if="aiTab === 'chat'" ref="chatContainer" class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
        <div v-if="aiMessages.length === 0" class="flex flex-col items-center justify-center h-full text-center py-8">
          <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-gray-300 mb-2" />
          <p class="text-xs text-gray-400">{{ language === 'en' ? 'Ask me about your project or use the buttons above' : 'Pregúntame sobre tu proyecto o usa los botones de arriba' }}</p>
        </div>

        <div
          v-for="(msg, i) in aiMessages"
          :key="i"
          class="text-xs leading-relaxed"
          :class="msg.role === 'user' ? 'text-right' : ''"
        >
          <div
            class="inline-block max-w-[90%] rounded-xl px-3 py-2"
            :class="msg.role === 'user'
              ? 'bg-focusflow-50 dark:bg-focusflow-500/10 text-gray-900 dark:text-gray-100'
              : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300'"
          >
            <!-- Suggestions -->
            <div v-if="msg.role === 'assistant' && msg.type === 'suggestions'" class="space-y-2">
              <p class="font-semibold text-focusflow-700 mb-1">{{ language === 'en' ? 'Suggested tasks:' : 'Tareas sugeridas:' }}</p>
              <div
                v-for="(s, si) in msg.suggestions"
                :key="si"
                class="flex items-start gap-2 bg-white dark:bg-[#1b1b1b] rounded-lg p-2 transition-all border border-gray-100 dark:border-white/10"
                :class="addedSuggestions.has(s.title) ? 'opacity-50' : 'cursor-pointer hover:ring-1 hover:ring-focusflow-300'"
                @click="!addedSuggestions.has(s.title) && addSuggestedTask(s)"
              >
                <UIcon
                  :name="addedSuggestions.has(s.title) ? 'i-heroicons-check-circle' : 'i-heroicons-plus-circle'"
                  class="w-3.5 h-3.5 mt-0.5 shrink-0"
                  :class="addedSuggestions.has(s.title) ? 'text-emerald-500' : 'text-focusflow-700'"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ s.title }}</p>
                  <p class="text-gray-500 dark:text-[#99a0ae] mt-0.5">{{ s.description }}</p>
                </div>
              </div>
              <button
                v-if="msg.suggestions?.some((s: any) => !addedSuggestions.has(s.title))"
                class="mt-1 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-focusflow-50 text-focusflow-700 hover:bg-focusflow-100 transition-colors cursor-pointer"
                :disabled="aiLoading"
                @click="addAllSuggestedTasks(msg.suggestions!)"
              >
                {{ t.createAllOnBoard }}
              </button>
            </div>

            <!-- Daily plan -->
            <div v-else-if="msg.role === 'assistant' && msg.type === 'daily_plan'">
              <p class="font-semibold text-emerald-700 mb-1">{{ msg.plan.greeting }}</p>
              <div class="space-y-1 mt-2">
                <div v-for="(ft, ti) in msg.plan.focus_tasks" :key="ti" class="flex items-center gap-1.5">
                  <span class="text-gray-400">{{ Number(ti) + 1 }}.</span>
                  <span class="text-gray-900 dark:text-gray-100">{{ ft }}</span>
                </div>
              <button
                class="mt-2 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                @click="addDailyPlanTasks(msg.plan.focus_tasks)"
                :disabled="aiLoading"
              >
                {{ t.createAllOnBoard }}
              </button>
              </div>
              <div v-if="msg.plan.pomodoro_suggestion" class="mt-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                {{ msg.plan.pomodoro_suggestion }}
              </div>
              <p v-if="msg.plan.procrastination_tip" class="mt-2 text-amber-700 font-medium">{{ msg.plan.procrastination_tip }}</p>
              <p class="mt-2 text-gray-500 dark:text-[#99a0ae] italic">{{ msg.plan.tip }}</p>
            </div>

            <!-- Anti-procrastination -->
            <div v-else-if="msg.role === 'assistant' && msg.type === 'anti_procrastination'" class="space-y-2">
              <div class="flex items-center gap-2 mb-2">
                <p class="font-semibold text-amber-700">{{ language === 'en' ? 'Anti-Procrastination Analysis' : 'Análisis Anti-Procrastinación' }}</p>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="msg.analysis.score > 60 ? 'bg-red-50 text-red-700' : msg.analysis.score > 30 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'">
                  {{ language === 'en' ? 'Risk' : 'Riesgo' }}: {{ msg.analysis.score }}/100
                </span>
              </div>
              <p class="text-gray-700 dark:text-gray-300">{{ msg.analysis.analysis }}</p>
              <div v-if="msg.analysis.quick_wins?.length" class="mt-2">
                <p class="font-semibold text-emerald-700 text-[10px] uppercase tracking-wider mb-1">{{ language === 'en' ? 'Quick Wins (under 15 min):' : 'Quick Wins (menos de 15 min):' }}</p>
                <div v-for="(qw, qi) in msg.analysis.quick_wins" :key="qi" class="text-gray-700 dark:text-gray-300">• {{ qw }}</div>
              </div>
              <div v-if="msg.analysis.techniques?.length" class="mt-2 space-y-1">
                <p class="font-semibold text-focusflow-700 text-[10px] uppercase tracking-wider mb-1">{{ language === 'en' ? 'Recommended techniques:' : 'Técnicas recomendadas:' }}</p>
                <div v-for="(tech, ti) in msg.analysis.techniques" :key="ti" class="bg-white dark:bg-[#1b1b1b] rounded-lg p-2 border border-gray-100 dark:border-white/10">
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ tech.name }}</p>
                  <p class="text-gray-500 dark:text-[#99a0ae] mt-0.5">{{ tech.description }}</p>
                </div>
              </div>
              <p v-if="msg.analysis.motivation" class="mt-2 text-focusflow-700 font-medium italic">{{ msg.analysis.motivation }}</p>
            </div>

            <!-- Document architecture -->
            <div v-else-if="msg.role === 'assistant' && msg.type === 'architecture'" class="space-y-2">
              <p class="font-semibold text-purple-700 mb-1">{{ msg.doc.title }}</p>
              <p class="text-gray-700 dark:text-gray-300 italic">{{ msg.doc.summary }}</p>

              <!-- Sections with category badges -->
              <div v-for="(section, si) in msg.doc.sections" :key="si" class="mt-2">
                <div class="flex items-center gap-1.5 mb-1">
                  <span
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                    :class="sectionCategory(section.heading)"
                  >
                    {{ sectionTag(section.heading) }}
                  </span>
                  <p class="font-semibold text-gray-900 dark:text-gray-100 text-[11px] uppercase tracking-wider">{{ section.heading }}</p>
                </div>
                <p class="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line text-[11px] leading-relaxed">{{ section.content }}</p>
              </div>

              <!-- Risks -->
              <div v-if="msg.doc.risks?.length" class="mt-2 bg-red-50 dark:bg-red-500/10 rounded-lg p-2">
                <p class="font-semibold text-red-700 text-[10px] uppercase tracking-wider mb-1">{{ language === 'en' ? 'Identified risks:' : 'Riesgos identificados:' }}</p>
                <div v-for="(risk, ri) in msg.doc.risks" :key="ri" class="text-red-700 text-[11px]">• {{ risk }}</div>
              </div>

              <!-- Recommendations -->
              <div v-if="msg.doc.recommendations?.length" class="mt-2 bg-focusflow-50 dark:bg-focusflow-500/10 rounded-lg p-2">
                <p class="font-semibold text-focusflow-700 text-[10px] uppercase tracking-wider mb-1">{{ t.recommendations }}:</p>
                <div v-for="(rec, ri) in msg.doc.recommendations" :key="ri" class="text-focusflow-700 text-[11px]">• {{ rec }}</div>
              </div>

              <!-- Tasks created summary -->
              <div v-if="msg.doc.tasksCreated > 0" class="mt-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-2">
                <p class="font-semibold text-emerald-700 text-[10px] uppercase tracking-wider mb-1">{{ msg.doc.tasksCreated }} {{ language === 'en' ? 'tasks created:' : 'tareas creadas:' }}</p>
                <div v-for="(task, ti) in (msg.doc.createdTasks || []).slice(0, 8)" :key="ti" class="flex items-center gap-1.5 text-[11px]">
                  <span
                    class="px-1 py-0.5 rounded text-[9px] font-bold"
                    :class="task.priority === 'high' || task.priority === 'critical' ? 'bg-red-100 dark:bg-red-500/10 text-red-700' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'"
                  >{{ task.priority }}</span>
                  <span class="text-emerald-800">{{ task.title }}</span>
                </div>
              </div>
            </div>

            <!-- Improve task -->
            <div v-else-if="msg.role === 'assistant' && msg.type === 'improve'" class="space-y-1.5">
              <p class="font-semibold text-amber-700 mb-1">{{ language === 'en' ? 'Improved task:' : 'Tarea mejorada:' }}</p>
              <p><span class="text-gray-400">{{ t.title }}:</span> <span class="text-gray-900 dark:text-gray-100 font-medium">{{ msg.improved.title }}</span></p>
              <p class="text-gray-600 dark:text-gray-400">{{ msg.improved.description }}</p>
              <div class="flex gap-1.5 flex-wrap mt-1">
                <span v-for="tag in msg.improved.tags" :key="tag" class="px-1.5 py-0.5 rounded bg-focusflow-50 text-focusflow-700 text-[10px] font-semibold">{{ tag }}</span>
              </div>
              <button
                class="mt-2 w-full text-center py-1.5 rounded-lg bg-focusflow-50 text-focusflow-700 font-semibold hover:bg-focusflow-100 transition-colors cursor-pointer"
                @click="applyImprovedTask(msg.improved)"
              >
                {{ language === 'en' ? 'Apply changes' : 'Aplicar cambios' }}
              </button>
            </div>

            <div v-else>
              <p>{{ msg.text }}</p>
              <button
                v-if="msg.showRetryAsTasks"
                class="mt-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                :disabled="aiLoading"
                @click="retryAsTaskSuggestions(msg.text!)"
              >
                {{ language === 'en' ? 'Retry as tasks' : 'Reintentar como tareas' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="aiLoading" class="flex items-center gap-2 text-xs text-gray-400">
          <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
          {{ language === 'en' ? 'Thinking...' : 'Pensando...' }}
        </div>
      </div>

      <!-- Chat input (chat tab only) -->
      <div v-if="aiTab === 'chat'" class="px-3 py-2 border-t border-gray-100 dark:border-white/10">
        <form class="flex gap-2" @submit.prevent="handleChat">
          <input
            v-model="chatInput"
            :placeholder="language === 'en' ? 'Ask something...' : 'Pregunta algo...'"
            class="flex-1 bg-gray-50 dark:bg-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-1 focus:ring-focusflow-300 border border-gray-100 dark:border-white/10"
            :disabled="aiLoading"
          />
          <button
            type="submit"
            class="w-8 h-8 rounded-lg bg-focusflow-600 text-white flex items-center justify-center hover:bg-focusflow-700 transition-colors disabled:opacity-50 cursor-pointer"
            :disabled="!chatInput.trim() || aiLoading"
          >
            <UIcon name="i-heroicons-paper-airplane" class="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Project, KanbanColumn, Task, MemoryAgent, TokenUsageStats } from '~/types'

const props = defineProps<{
  workspaceId: string
  projectId: string
  project: Project | null
  columns: KanbanColumn[]
  selectedTask: Task | null
  language: string
  t: Record<string, any>
}>()

const emit = defineEmits<{
  loadTasks: []
}>()

// AI state
const showAiPanel = ref(false)
const aiLoading = ref(false)
const chatInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)

// AI tab state
const aiTab = ref<'chat' | 'memory' | 'tokens'>('chat')
const memoryAgents = ref<MemoryAgent[]>([])
const memoryTotalCount = ref(0)
const memoryLoading = ref(false)

interface AiMessage {
  role: 'user' | 'assistant'
  text?: string
  type?: 'text' | 'suggestions' | 'daily_plan' | 'improve' | 'anti_procrastination' | 'architecture' | 'doc_agent'
  suggestions?: any[]
  plan?: any
  improved?: any
  analysis?: any
  doc?: any
  showRetryAsTasks?: boolean
}
const aiMessages = ref<AiMessage[]>([])
const addedSuggestions = ref<Set<string>>(new Set())

// Token usage state
const tokenStats = ref<TokenUsageStats | null>(null)
const tokenLoading = ref(false)

const tokenTodayCount = computed(() => {
  if (!tokenStats.value?.byDay) return 0
  const today = new Date().toISOString().slice(0, 10)
  return tokenStats.value.byDay.find(d => d.date === today)?.tokens || 0
})

const tokenAvgPerCall = computed(() => {
  if (!tokenStats.value?.byAction) return 0
  const actionCount = Object.keys(tokenStats.value.byAction).length
  if (actionCount === 0) return 0
  return Math.round(tokenStats.value.totalTokens / actionCount)
})

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

async function loadMemoryAgents() {
  if (!props.workspaceId) return
  memoryLoading.value = true
  try {
    const res = await $fetch<{ agents: MemoryAgent[]; totalMemories: number }>(`/api/workspaces/${props.workspaceId}/memory/agents`)
    memoryAgents.value = res.agents
    memoryTotalCount.value = res.totalMemories
  } catch (e: any) {
    console.error('[memory] Load agents error:', e.message)
  } finally {
    memoryLoading.value = false
  }
}

async function loadTokenUsage() {
  if (!props.workspaceId) return
  tokenLoading.value = true
  try {
    const data = await $fetch<TokenUsageStats>(`/api/workspaces/${props.workspaceId}/usage`)
    tokenStats.value = data
  } catch (e: any) {
    console.error('[tokens] Load error:', e.message)
  } finally {
    tokenLoading.value = false
  }
}

function scrollChat() {
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })
}

function sectionCategory(heading: string): string {
  const h = heading.toLowerCase()
  if (h.includes('devops') || h.includes('ci/cd') || h.includes('pipeline') || h.includes('deploy')) return 'bg-orange-100 dark:bg-orange-500/10 text-orange-700'
  if (h.includes('infra') || h.includes('hosting') || h.includes('scaling') || h.includes('docker')) return 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700'
  if (h.includes('monitor') || h.includes('observ') || h.includes('logging') || h.includes('health')) return 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700'
  if (h.includes('seguridad') || h.includes('security') || h.includes('auth') || h.includes('rls')) return 'bg-red-100 dark:bg-red-500/10 text-red-700'
  if (h.includes('backend') || h.includes('api') || h.includes('modelo') || h.includes('datos')) return 'bg-blue-100 dark:bg-blue-500/10 text-blue-700'
  if (h.includes('testing') || h.includes('test') || h.includes('cobertura')) return 'bg-green-100 dark:bg-green-500/10 text-green-700'
  if (h.includes('flujo') || h.includes('branch') || h.includes('release') || h.includes('git')) return 'bg-purple-100 dark:bg-purple-500/10 text-purple-700'
  return 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
}

function sectionTag(heading: string): string {
  const h = heading.toLowerCase()
  if (h.includes('devops') || h.includes('ci/cd') || h.includes('pipeline') || h.includes('deploy')) return 'DevOps'
  if (h.includes('infra') || h.includes('hosting') || h.includes('scaling') || h.includes('docker')) return 'Infra'
  if (h.includes('monitor') || h.includes('observ') || h.includes('logging') || h.includes('health')) return 'Ops'
  if (h.includes('seguridad') || h.includes('security') || h.includes('auth') || h.includes('rls')) return 'Security'
  if (h.includes('backend') || h.includes('api')) return 'Backend'
  if (h.includes('modelo') || h.includes('datos') || h.includes('data')) return 'DB'
  if (h.includes('testing') || h.includes('test') || h.includes('cobertura')) return 'Testing'
  if (h.includes('flujo') || h.includes('branch') || h.includes('release') || h.includes('git')) return 'Workflow'
  if (h.includes('visión') || h.includes('vision') || h.includes('general') || h.includes('alcance')) return 'General'
  if (h.includes('recomend') || h.includes('mejora')) return props.language === 'en' ? 'Improvements' : 'Mejoras'
  return 'Doc'
}

// --- AI Core ---
async function callAI(action: string, context: Record<string, any>) {
  aiLoading.value = true
  try {
    const res = await $fetch<{ type: string; data: any }>('/api/ai/assist', {
      method: 'POST',
      body: { action, context: { ...context, workspaceId: props.workspaceId } },
    })
    return res
  } catch (e: any) {
    aiMessages.value.push({ role: 'assistant', text: `Error: ${e.data?.message || e.message || (props.language === 'en' ? 'Could not connect to AI' : 'No se pudo conectar con AI')}`, type: 'text' })
    scrollChat()
    return null
  } finally {
    aiLoading.value = false
  }
}

function findColumn(type: 'todo' | 'progress'): string {
  const cols = props.columns
  if (!cols.length) return ''
  if (cols.length <= 2) return cols[0]!.id

  if (type === 'todo') {
    return cols[1]?.id || cols[0]!.id
  }

  const progressKeywords = ['progreso', 'progress', 'dev', 'desarrollo', 'creación', 'diseño ui', 'desarrollo frontend']
  const match = cols.find(c => progressKeywords.some(k => c.title.toLowerCase().includes(k)))
  if (match) return match.id
  return cols[Math.floor(cols.length / 2)]?.id || cols[1]?.id || cols[0]!.id
}

async function handleSuggestTasks() {
  showAiPanel.value = true
  aiTab.value = 'chat'
  aiMessages.value.push({ role: 'user', text: props.language === 'en' ? 'Suggest tasks for this project' : 'Sugiéreme tareas para este proyecto' })
  scrollChat()
  const res = await callAI('suggest_tasks', {
    projectName: props.project?.name || '',
    projectDescription: props.project?.description || '',
  })
  if (res?.type === 'json' && Array.isArray(res.data)) {
    aiMessages.value.push({ role: 'assistant', type: 'suggestions', suggestions: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function addSuggestedTask(suggestion: any) {
  const columnId = findColumn('todo')
  if (!columnId) return
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks`, {
      method: 'POST',
      body: {
        project_id: props.projectId,
        column_id: columnId,
        title: suggestion.title,
        description: suggestion.description || null,
        priority: suggestion.priority || 'medium',
        tags: suggestion.tags || [],
      },
    })
    addedSuggestions.value.add(suggestion.title)
    emit('loadTasks')
    const colName = props.columns.find(c => c.id === columnId)?.title || ''
    aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? `"${suggestion.title}" added to ${colName}` : `"${suggestion.title}" agregada a ${colName}`, type: 'text' })
    scrollChat()
  } catch (e: any) {
    aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? `Error adding: ${e.message}` : `Error al agregar: ${e.message}`, type: 'text' })
    scrollChat()
  }
}

async function addAllSuggestedTasks(suggestions: any[]) {
  const columnId = findColumn('todo')
  if (!columnId) return
  const pending = suggestions.filter(s => !addedSuggestions.value.has(s.title))
  if (!pending.length) return
  let added = 0
  for (const s of pending) {
    try {
      await $fetch(`/api/workspaces/${props.workspaceId}/tasks`, {
        method: 'POST',
        body: {
          project_id: props.projectId,
          column_id: columnId,
          title: s.title,
          description: s.description || null,
          priority: s.priority || 'medium',
          tags: s.tags || [],
        },
      })
      addedSuggestions.value.add(s.title)
      added++
    } catch { /* continue */ }
  }
  emit('loadTasks')
  const colName = props.columns.find(c => c.id === columnId)?.title || ''
  aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? `${added} tasks created in ${colName}` : `${added} tareas creadas en ${colName}`, type: 'text' })
  scrollChat()
}

async function addDailyPlanTasks(focusTasks: string[]) {
  const columnId = findColumn('progress')
  if (!columnId || !focusTasks?.length) return
  let added = 0
  for (const title of focusTasks) {
    try {
      await $fetch(`/api/workspaces/${props.workspaceId}/tasks`, {
        method: 'POST',
        body: {
          project_id: props.projectId,
          column_id: columnId,
          title,
          priority: 'high',
          tags: ['plan-del-día'],
        },
      })
      added++
    } catch { /* continue */ }
  }
  emit('loadTasks')
  const colName = props.columns.find(c => c.id === columnId)?.title || ''
  aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? `${added} plan tasks created in ${colName}` : `${added} tareas del plan creadas en ${colName}`, type: 'text' })
  scrollChat()
}

async function handleDailyPlan() {
  if (!props.project) return
  showAiPanel.value = true
  aiTab.value = 'chat'
  aiMessages.value.push({ role: 'user', text: props.language === 'en' ? 'Give me a plan for today' : 'Dame un plan para hoy' })
  scrollChat()
  const res = await callAI('daily_plan', { projectId: props.project.id })
  if (res?.type === 'json' && res.data.focus_tasks) {
    aiMessages.value.push({ role: 'assistant', type: 'daily_plan', plan: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function handleAntiProcrastination() {
  if (!props.project) return
  showAiPanel.value = true
  aiTab.value = 'chat'
  aiMessages.value.push({ role: 'user', text: props.language === 'en' ? 'Analyze my procrastination on this project' : 'Analiza mi procrastinación en este proyecto' })
  scrollChat()
  const res = await callAI('anti_procrastination', { projectId: props.project.id, projectName: props.project.name })
  if (res?.type === 'json' && res.data.score !== undefined) {
    aiMessages.value.push({ role: 'assistant', type: 'anti_procrastination', analysis: res.data })
    const { suggestFocusMusic } = useLofiPlayer()
    suggestFocusMusic()
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function handleDocumentArchitecture() {
  if (!props.project) return
  showAiPanel.value = true
  aiTab.value = 'chat'
  aiMessages.value.push({ role: 'user', text: props.language === 'en' ? 'Document the workspace architecture' : 'Documenta la arquitectura del workspace' })
  scrollChat()
  const res = await callAI('document_architecture', { projectId: props.project.id })
  if (res?.type === 'json' && res.data.title) {
    aiMessages.value.push({ role: 'assistant', type: 'architecture', doc: res.data })
    emit('loadTasks')

    const parts: string[] = []
    if (res.data.tasksCreated > 0) {
      parts.push(props.language === 'en' ? `${res.data.tasksCreated} tasks created on the board` : `${res.data.tasksCreated} tareas creadas en el tablero`)
    }
    if (res.data.document) parts.push(props.language === 'en' ? 'document saved' : 'documento guardado')
    if (res.data.savedFile) parts.push(props.language === 'en' ? '.md file in Files' : 'archivo .md en Archivos')

    if (parts.length > 0) {
      aiMessages.value.push({ role: 'assistant', text: parts.join(' · '), type: 'text' })
    }
    if (res.data.postError) {
      aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? `Note: post-processing error: ${res.data.postError}` : `Nota: hubo un error en post-procesamiento: ${res.data.postError}`, type: 'text' })
    }
    scrollChat()
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

const docAgentNames: Record<string, string> = {
  doc_backend_architecture: 'Backend Senior Architecture',
  doc_aws_expert: 'AWS Senior Expert',
  doc_frontend_design: 'Frontend Design (Context7)',
  doc_marketing: 'Marketing Documentation',
  doc_ai_agents: 'AI Agents Documentation',
}

async function handleDocAgent(action: string) {
  if (!props.project) return
  showAiPanel.value = true
  aiTab.value = 'chat'
  const agentName = docAgentNames[action] || action
  aiMessages.value.push({ role: 'user', text: props.language === 'en' ? `Generate documentation: ${agentName}` : `Genera documentación: ${agentName}` })
  scrollChat()
  const res = await callAI(action, { projectId: props.project.id })
  if (res?.type === 'json' && res.data.title) {
    aiMessages.value.push({ role: 'assistant', type: 'architecture', doc: res.data })
    emit('loadTasks')

    const parts: string[] = []
    if (res.data.tasksCreated > 0) parts.push(props.language === 'en' ? `${res.data.tasksCreated} tasks created` : `${res.data.tasksCreated} tareas creadas`)
    if (res.data.document) parts.push(props.language === 'en' ? 'document saved' : 'documento guardado')
    if (res.data.savedFile) parts.push(props.language === 'en' ? '.md file generated' : 'archivo .md generado')
    if (res.data.sessionId) parts.push(`session: ${res.data.sessionId.slice(0, 8)}`)

    if (parts.length > 0) {
      aiMessages.value.push({ role: 'assistant', text: parts.join(' · '), type: 'text' })
    }
    if (res.data.postError) {
      aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? `Note: ${res.data.postError}` : `Nota: ${res.data.postError}`, type: 'text' })
    }
    scrollChat()
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function handleImproveTask() {
  if (!props.selectedTask) return
  showAiPanel.value = true
  aiTab.value = 'chat'
  aiMessages.value.push({ role: 'user', text: props.language === 'en' ? `Improve task: "${props.selectedTask.title}"` : `Mejora la tarea: "${props.selectedTask.title}"` })
  scrollChat()
  const res = await callAI('improve_task', {
    taskTitle: props.selectedTask.title,
    taskDescription: props.selectedTask.description || '',
    priority: props.selectedTask.priority,
  })
  if (res?.type === 'json' && res.data.title) {
    aiMessages.value.push({ role: 'assistant', type: 'improve', improved: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function applyImprovedTask(improved: any) {
  if (!props.selectedTask) return
  try {
    const updates: Record<string, unknown> = {}
    if (improved.title) updates.title = improved.title
    if (improved.description) updates.description = improved.description
    if (improved.priority_suggestion) updates.priority = improved.priority_suggestion
    if (improved.estimated_hours) updates.estimated_hours = improved.estimated_hours
    if (improved.tags?.length) updates.tags = improved.tags

    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.selectedTask.id}`, {
      method: 'PATCH',
      body: updates,
    })
    emit('loadTasks')
    aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? 'Improvements applied to task.' : 'Mejoras aplicadas a la tarea.', type: 'text' })
  } catch {
    aiMessages.value.push({ role: 'assistant', text: props.language === 'en' ? 'Error applying improvements.' : 'Error al aplicar mejoras.', type: 'text' })
  }
  scrollChat()
}

async function handleChat() {
  if (!chatInput.value.trim() || !props.project) return
  const message = chatInput.value.trim()
  chatInput.value = ''
  aiMessages.value.push({ role: 'user', text: message })
  scrollChat()

  const history = aiMessages.value.slice(-10).map(m => ({
    role: m.role,
    text: m.text || (m.type === 'suggestions' ? (props.language === 'en' ? 'Suggested tasks' : 'Sugerí tareas') : m.type === 'architecture' ? (props.language === 'en' ? 'Generated architecture document' : 'Generé documento de arquitectura') : (props.language === 'en' ? 'Assistant response' : 'Respuesta del asistente')),
  })).filter(m => m.text && m.text.length > 0)

  const res = await callAI('chat', {
    message,
    projectId: props.project.id,
    projectName: props.project.name,
    projectDescription: props.project.description || '',
    history,
  })

  const taskKeywords = ['crea', 'sugiere', 'genera', 'tareas', 'backlog', 'necesito', 'lista', 'pasos', 'descompón', 'descompon']

  if (res?.type === 'json' && Array.isArray(res.data)) {
    aiMessages.value.push({ role: 'assistant', type: 'suggestions', suggestions: res.data })
  } else if (res) {
    const wasTaskRequest = taskKeywords.some(k => message.toLowerCase().includes(k))
    const responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    aiMessages.value.push({
      role: 'assistant',
      text: responseText,
      type: 'text',
      showRetryAsTasks: wasTaskRequest && res.type === 'text',
    })
  }
  scrollChat()
}

async function retryAsTaskSuggestions(originalText: string) {
  if (!props.project) return
  const retryMessage = `Genera exactamente 5 tareas en JSON array para: ${originalText}`
  aiMessages.value.push({ role: 'user', text: retryMessage })
  scrollChat()

  const res = await callAI('chat', {
    message: retryMessage,
    projectId: props.project.id,
    projectName: props.project.name,
    projectDescription: props.project.description || '',
    history: [],
  })

  if (res?.type === 'json' && Array.isArray(res.data)) {
    aiMessages.value.push({ role: 'assistant', type: 'suggestions', suggestions: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

// Expose methods for parent to call from header buttons
defineExpose({
  handleSuggestTasks,
  handleAntiProcrastination,
  handleImproveTask,
  aiLoading,
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}
</style>
