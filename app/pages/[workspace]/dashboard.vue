<template>
  <div class="space-y-4">

      <!-- ═══════ HERO / WELCOME ═══════ -->
      <InspiraBlurReveal :delay="0" :duration="800">
        <div class="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d0d0d] via-[#1a1a2e] to-[#16213e] p-6 sm:p-8">
          <InspiraMeteors :number="12" />
          <div class="relative z-10">
            <Transition name="quote-fade" mode="out-in">
              <p :key="currentQuoteIndex" class="text-sm sm:text-base text-white/80">{{ motivationalQuote }}</p>
            </Transition>
            <h1 class="text-2xl sm:text-[42px] font-bold text-white leading-tight mt-1" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2px;">
              {{ greeting }}, {{ userName }} &#x1F44B;
            </h1>
          </div>
        </div>
      </InspiraBlurReveal>

      <!-- ═══════ BENTO GRID ═══════ -->
      <InspiraBentoGrid class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[160px] sm:auto-rows-[180px]">

        <!-- ── Stat: Total Tasks ── -->
        <InspiraBlurReveal :delay="100" class="col-span-1">
          <div class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 p-5 overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all duration-300 shadow-card hover:shadow-card-hover">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">{{ t.totalTasks }}</span>
              <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <InspiraNumberTicker :value="taskCount" :duration="1200" class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2px;" />
            <div class="flex items-end gap-[3px] h-[40px] mt-2">
              <div v-for="i in 7" :key="'t-'+i" class="w-[6px] rounded-sm transition-all duration-500"
                :class="i % 2 === 0 ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-white/10'"
                :style="{ height: `${statBarHeights.total[i - 1]}%` }" />
            </div>
          </div>
        </InspiraBlurReveal>

        <!-- ── Stat: In Progress ── -->
        <InspiraBlurReveal :delay="200" class="col-span-1">
          <div class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 p-5 overflow-hidden group hover:border-amber-200 dark:hover:border-amber-500/30 transition-all duration-300 shadow-card hover:shadow-card-hover">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">{{ t.inProgress }}</span>
              <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <InspiraNumberTicker :value="inProgressTasks" :duration="1200" :delay="200" class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2px;" />
            <div class="flex items-end gap-[3px] h-[40px] mt-2">
              <div v-for="i in 7" :key="'p-'+i" class="w-[6px] rounded-sm transition-all duration-500"
                :class="i % 3 === 0 ? 'bg-amber-500' : 'bg-gray-100 dark:bg-white/10'"
                :style="{ height: `${statBarHeights.progress[i - 1]}%` }" />
            </div>
          </div>
        </InspiraBlurReveal>

        <!-- ── Stat: Completed ── -->
        <InspiraBlurReveal :delay="300" class="col-span-1">
          <div class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 p-5 overflow-hidden group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300 shadow-card hover:shadow-card-hover">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">{{ t.completed }}</span>
              <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <InspiraNumberTicker :value="completedTasks" :duration="1200" :delay="400" class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2px;" />
            <div class="flex items-end gap-[3px] h-[40px] mt-2">
              <div v-for="i in 7" :key="'c-'+i" class="w-[6px] rounded-sm transition-all duration-500"
                :class="i <= 4 ? 'bg-blue-500' : 'bg-gray-100 dark:bg-white/10'"
                :style="{ height: `${statBarHeights.completed[i - 1]}%` }" />
            </div>
          </div>
        </InspiraBlurReveal>

        <!-- ── Assessment Score ── -->
        <InspiraBlurReveal :delay="400" class="col-span-1">
          <div v-if="assessmentScore !== null" class="relative h-full rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300"
            :class="assessmentScore <= 30 ? 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-[#1b1b1b] border border-emerald-200/60 dark:border-emerald-500/20' : assessmentScore <= 60 ? 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-[#1b1b1b] border border-amber-200/60 dark:border-amber-500/20' : 'bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-[#1b1b1b] border border-red-200/60 dark:border-red-500/20'">
            <InspiraBorderBeam :size="120" :duration="10"
              :color-from="assessmentScore <= 30 ? '#10b981' : assessmentScore <= 60 ? '#f59e0b' : '#ef4444'"
              :color-to="assessmentScore <= 30 ? '#06b6d4' : assessmentScore <= 60 ? '#fb923c' : '#f97316'" />
            <div class="p-5">
              <div class="flex items-center gap-4">
                <div class="relative w-16 h-16 shrink-0">
                  <svg class="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke-width="6" class="stroke-gray-100 dark:stroke-white/10" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke-width="6" stroke-linecap="round"
                      :stroke="assessmentScore <= 30 ? '#10b981' : assessmentScore <= 60 ? '#f59e0b' : '#ef4444'"
                      :stroke-dasharray="`${(assessmentScore / 100) * 163.36} 163.36`"
                      class="transition-all duration-1000" />
                  </svg>
                  <span class="absolute inset-0 flex items-center justify-center text-lg font-black tabular-nums"
                    :class="assessmentScore <= 30 ? 'text-emerald-600 dark:text-emerald-400' : assessmentScore <= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'"
                    style="font-family: 'Space Grotesk', sans-serif;">{{ assessmentScore }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <div class="w-2 h-2 rounded-full animate-pulse"
                      :class="assessmentScore <= 30 ? 'bg-emerald-500' : assessmentScore <= 60 ? 'bg-amber-500' : 'bg-red-500'" />
                    <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{{ t.procrastinationRisk }}</p>
                  </div>
                  <p class="text-sm font-bold"
                    :class="assessmentScore <= 30 ? 'text-emerald-700 dark:text-emerald-300' : assessmentScore <= 60 ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'">
                    {{ assessmentScore <= 30 ? t.quizLowRisk : assessmentScore <= 60 ? t.quizModerateRisk : t.quizHighRisk }}
                  </p>
                  <p v-if="assessmentAnalysis" class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{{ assessmentAnalysis }}</p>
                </div>
              </div>
              <button class="mt-3 text-[11px] font-semibold px-3 py-1 rounded-full transition-all hover:shadow-sm"
                :class="assessmentScore <= 30 ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25' : assessmentScore <= 60 ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25' : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/15 hover:bg-red-200 dark:hover:bg-red-500/25'"
                @click="retakeQuiz">{{ t.quizRetake }}</button>
            </div>
          </div>
          <div v-else class="relative h-full bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-950/20 dark:to-[#1b1b1b] rounded-2xl border border-violet-200/50 dark:border-violet-500/15 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all group" @click="showQuiz = true">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-6 h-6 text-white" />
            </div>
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ t.procrastinationRisk }}</p>
            <p class="text-[11px] text-violet-600 dark:text-violet-400 font-bold mt-1.5 group-hover:underline">{{ lang.language.value === 'en' ? 'Take the quiz' : 'Realiza el quiz' }}</p>
          </div>
        </InspiraBlurReveal>

        <!-- ── Project Summary Chart (spans 2 cols) ── -->
        <InspiraBlurReveal :delay="200" class="col-span-1 sm:col-span-2 row-span-2">
          <div class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card p-5 overflow-hidden">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100" style="letter-spacing: -0.32px;">{{ t.projectSummary }}</h3>
              <span class="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-1">{{ t.thisMonth }}</span>
            </div>
            <div class="flex gap-2">
              <div class="flex flex-col justify-between text-[11px] text-gray-600 dark:text-gray-300 h-[200px] pr-1">
                <span>600</span><span>500</span><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
              </div>
              <div class="flex-1">
                <div class="relative h-[200px] border-b border-gray-200 dark:border-white/10">
                  <div v-for="i in 6" :key="'gl-'+i" class="absolute w-full border-t border-gray-200 dark:border-white/10"
                    :style="{ top: `${(i - 1) * (100/6)}%` }" />
                  <div class="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full px-2">
                    <div v-for="(bar, idx) in projectBars" :key="idx" class="flex flex-col items-center gap-1" style="width: 40px;">
                      <div class="w-[28px] rounded-t-md transition-all duration-700"
                        :class="idx % 2 === 0 ? 'bg-[#0D0D0D] dark:bg-white/80' : 'bg-emerald-500'"
                        :style="{ height: `${bar.height}%` }" />
                    </div>
                  </div>
                </div>
                <div class="flex justify-around mt-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                  <span>{{ lang.language.value === 'en' ? 'Jan' : 'Ene' }}</span><span>Feb</span><span>Mar</span><span>{{ lang.language.value === 'en' ? 'Apr' : 'Abr' }}</span><span>May</span>
                </div>
              </div>
            </div>
          </div>
        </InspiraBlurReveal>

        <!-- ── Token Usage (compact) ── -->
        <InspiraBlurReveal :delay="300" class="col-span-1">
          <div v-if="canViewUsageStats" class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card p-5 overflow-hidden group hover:shadow-lg transition-all duration-300">
            <InspiraBorderBeam :size="100" :duration="12" color-from="#10b981" color-to="#3b82f6" :delay="2" />
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ t.tokenUsage }}</h3>
              <button @click="loadTokenUsage" class="text-[10px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full px-2.5 py-0.5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
                {{ tokenLoading ? '...' : t.update }}
              </button>
            </div>
            <template v-if="tokenStats">
              <div class="flex items-center gap-3">
                <svg class="w-[50px] h-[50px] shrink-0" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke-width="4" class="stroke-gray-200 dark:stroke-white/10" />
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#10B981" stroke-width="4"
                    :stroke-dasharray="125.66" :stroke-dashoffset="125.66 * (1 - (tokenStats.percentUsed / 100))"
                    stroke-linecap="round" transform="rotate(-90 25 25)" class="transition-all duration-700" />
                </svg>
                <div>
                  <span class="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">{{ formatTokens(tokenStats.totalTokens) }}</span>
                  <p class="text-[10px] text-gray-600 dark:text-gray-300">{{ formatTokens(tokenStats.totalTokens) }} / {{ formatTokens(tokenStats.limit) }}</p>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-3 mt-2">
                <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
                <div class="space-y-2 flex-1">
                  <div class="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse w-1/2" />
                  <div class="h-3 bg-gray-100 dark:bg-white/10 rounded animate-pulse w-2/3" />
                </div>
              </div>
            </template>
          </div>
          <div v-else class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card p-5 flex items-center justify-center">
            <p class="text-xs text-gray-600 dark:text-gray-300">{{ lang.language.value === 'en' ? 'AI Usage' : 'Uso de AI' }}</p>
          </div>
        </InspiraBlurReveal>

        <!-- ── Pomodoro Timer ── -->
        <InspiraBlurReveal :delay="400" class="col-span-1 row-span-2">
          <div class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card p-5 overflow-hidden group hover:shadow-lg transition-all duration-300">
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{{ t.pomodoroTimer }}</p>
            <div class="flex flex-col items-center">
              <div class="relative">
                <svg class="w-[100px] h-[100px]" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" class="stroke-gray-100 dark:stroke-white/10" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#10B981" stroke-width="6"
                    :stroke-dasharray="213.63" :stroke-dashoffset="pomodoroRingOffset"
                    stroke-linecap="round" transform="rotate(-90 40 40)"
                    class="transition-all duration-1000" />
                </svg>
                <button @click="togglePomodoro" class="absolute inset-0 flex items-center justify-center cursor-pointer">
                  <span class="text-xl text-emerald-500">{{ pomodoroRunning ? '⏸' : '▶' }}</span>
                </button>
              </div>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums mt-2" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">
                {{ pomodoroDisplay }}
              </p>
              <p class="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
                {{ pomodoroPhase === 'work' ? t.focusSession : t.breakTime }}
              </p>
              <p v-if="pomodoro.activeTask.value" class="text-[10px] text-emerald-600 font-medium mt-0.5 truncate max-w-full">
                {{ lang.language.value === 'en' ? 'Focused on' : 'Enfocado en' }}: {{ pomodoro.activeTask.value.title }}
              </p>
              <p v-else class="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">{{ lang.language.value === 'en' ? 'Free session' : 'Sesión libre' }}</p>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
              <div class="flex items-center gap-4">
                <div>
                  <p class="text-[10px] text-gray-600 dark:text-gray-300">{{ lang.language.value === 'en' ? 'Sessions' : 'Sesiones' }}</p>
                  <p class="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ pomodoroSessions }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-gray-600 dark:text-gray-300">{{ lang.language.value === 'en' ? 'Streak' : 'Racha' }}</p>
                  <p class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ streak }}d</p>
                </div>
              </div>
              <button @click="togglePomodoro"
                class="px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                :class="pomodoroRunning ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'">
                {{ pomodoroRunning ? t.pause : t.start }}
              </button>
            </div>
            <button v-if="pushNotif.permission.value !== 'granted'" @click="pushNotif.requestPermission()"
              class="w-full mt-2 px-3 py-1 rounded-lg text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 transition-all cursor-pointer">
              {{ t.enableNotifications }}
            </button>
          </div>
        </InspiraBlurReveal>

        <!-- ── Task List (spans 2 cols, 2 rows) ── -->
        <InspiraBlurReveal :delay="200" class="col-span-1 sm:col-span-2 lg:col-span-3 row-span-2">
          <div class="relative h-full bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card overflow-hidden">
            <div class="flex items-center justify-between p-4 pb-2">
              <div class="flex items-center gap-3">
                <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100" style="letter-spacing: -0.32px;">{{ t.board }}</h3>
                <select v-model="filterProjectId"
                  class="text-[11px] font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-1 border-0 outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors appearance-none pr-6"
                  style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%237A7A7A%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 8px center; background-size: 14px;">
                  <option value="">{{ lang.language.value === 'en' ? 'All tasks' : 'Todas las tareas' }}</option>
                  <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <button class="text-[11px] font-medium px-3 py-1 rounded-full transition-all cursor-pointer"
                  :class="showFilters ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/10'"
                  @click="showFilters = !showFilters">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-heroicons-funnel" class="w-3 h-3" />
                    {{ t.filters }}
                  </span>
                </button>
              </div>
              <NuxtLink :to="`/${store.slug}/projects`" class="text-xs text-emerald-500 font-semibold hover:text-emerald-700 transition-colors">
                {{ t.viewAll }}
              </NuxtLink>
            </div>
            <div v-if="showFilters" class="px-4 pb-2 flex items-center gap-2">
              <select v-model="filterPriority" class="text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer">
                <option value="">{{ t.priority }}</option>
                <option value="urgent">{{ t.priorityCritical }}</option>
                <option value="high">{{ t.priorityHigh }}</option>
                <option value="medium">{{ t.priorityMedium }}</option>
                <option value="low">{{ t.priorityLow }}</option>
              </select>
              <select v-model="filterStatus" class="text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer">
                <option value="">{{ t.status }}</option>
                <option value="done">{{ t.done }}</option>
                <option value="progress">{{ t.inProgress }}</option>
              </select>
              <button v-if="filterPriority || filterStatus" class="text-[11px] text-red-500 font-medium cursor-pointer hover:text-red-700"
                @click="filterPriority = ''; filterStatus = ''">
                {{ lang.language.value === 'en' ? 'Clear' : 'Limpiar' }}
              </button>
            </div>
            <div class="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] px-4 py-2 text-[11px] font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">
              <span>{{ t.name }}</span>
              <span class="hidden md:block">{{ t.project }}</span>
              <span>{{ t.date }}</span>
              <span class="hidden md:block">{{ t.status }}</span>
              <span>{{ t.priority }}</span>
              <span class="hidden md:block">{{ t.deadline }}</span>
            </div>
            <div v-if="filteredTasks.length > 0" class="max-h-[280px] overflow-y-auto">
              <div v-for="task in filteredTasks" :key="task.id"
                class="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] px-4 py-2.5 text-[11px] border-b border-gray-200 dark:border-white/10 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{{ task.title?.charAt(0)?.toUpperCase() }}</span>
                  </div>
                  <span class="text-gray-900 dark:text-gray-100 font-medium truncate">{{ task.title }}</span>
                </div>
                <span class="text-gray-600 dark:text-gray-300 truncate hidden md:block">{{ task.projectName || '—' }}</span>
                <span class="text-gray-600 dark:text-gray-300">{{ task.dateShort }}</span>
                <span class="hidden md:block">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    :class="task.isCompleted ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'">
                    {{ task.isCompleted ? t.done : t.inProgress }}
                  </span>
                </span>
                <span>
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    :class="{
                      'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400': task.priority === 'high' || task.priority === 'urgent',
                      'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400': task.priority === 'medium',
                      'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400': task.priority === 'low',
                    }">
                    {{ task.priority === 'high' || task.priority === 'urgent' ? t.priorityHigh : task.priority === 'medium' ? t.priorityMedium : t.priorityLow }}
                  </span>
                </span>
                <span class="hidden md:block">
                  <span v-if="task.deadlineLabel" class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    :class="task.deadlineBg + ' ' + task.deadlineColor">
                    {{ task.deadlineLabel }}
                  </span>
                  <span v-else class="text-[10px] text-gray-600 dark:text-gray-300">—</span>
                </span>
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-10 text-gray-600 dark:text-gray-300">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-gray-600 dark:text-gray-300 mb-2" />
              <p class="text-xs">{{ recentTasks.length > 0 ? (lang.language.value === 'en' ? 'No results with these filters' : 'Sin resultados con estos filtros') : (lang.language.value === 'en' ? 'No recent tasks' : 'No hay tareas recientes') }}</p>
            </div>
          </div>
        </InspiraBlurReveal>

      </InspiraBentoGrid>

      <!-- ═══════ SECOND SECTION: Coach + Rankings + AI Details ═══════ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- ── Coach Anti-Procrastinación ── -->
        <InspiraBlurReveal :delay="100" class="lg:col-span-1">
          <div class="relative bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card overflow-hidden">
            <InspiraBorderBeam :size="150" :duration="12" color-from="#a855f7" color-to="#ec4899" :delay="1" />

            <!-- Header -->
            <div class="flex items-center justify-between p-5 pb-0">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                  <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{{ t.antiProcrastination }}</h3>
                  <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ lang.language.value === 'en' ? 'AI-powered insights' : 'Insights con IA' }}</p>
                </div>
              </div>
              <button
                class="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                :class="coachLoading ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-500/15 hover:text-violet-600 dark:hover:text-violet-400'"
                @click="loadCoachAdvice">
                <span v-if="coachLoading" class="flex items-center gap-1.5">
                  <span class="w-3 h-3 border-2 border-violet-300 border-t-violet-600 dark:border-violet-600 dark:border-t-violet-300 rounded-full animate-spin" />
                  {{ lang.language.value === 'en' ? 'Analyzing...' : 'Analizando...' }}
                </span>
                <span v-else>{{ t.update }}</span>
              </button>
            </div>

            <div class="p-5 pt-4">
              <!-- Loading state -->
              <div v-if="coachLoading" class="space-y-3">
                <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" />
                  <div class="flex-1 space-y-2">
                    <div class="h-3 bg-gray-100 dark:bg-white/10 rounded-full animate-pulse w-24" />
                    <div class="h-3 bg-gray-100 dark:bg-white/10 rounded-full animate-pulse w-full" />
                  </div>
                </div>
                <div class="h-3 bg-gray-100 dark:bg-white/10 rounded-full animate-pulse w-3/4" />
                <div class="h-3 bg-gray-100 dark:bg-white/10 rounded-full animate-pulse w-1/2" />
              </div>

              <!-- Coach data view -->
              <div v-else-if="coachData" class="space-y-4">
                <!-- Score badge -->
                <div class="flex items-center gap-3 p-3.5 rounded-xl border"
                  :class="coachData.score > 60 ? 'bg-red-50/80 dark:bg-red-500/8 border-red-200/50 dark:border-red-500/15' : coachData.score > 30 ? 'bg-amber-50/80 dark:bg-amber-500/8 border-amber-200/50 dark:border-amber-500/15' : 'bg-emerald-50/80 dark:bg-emerald-500/8 border-emerald-200/50 dark:border-emerald-500/15'">
                  <div class="relative w-12 h-12 shrink-0">
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="19" fill="none" stroke-width="4" class="stroke-gray-200/50 dark:stroke-white/5" />
                      <circle cx="24" cy="24" r="19" fill="none" stroke-width="4" stroke-linecap="round"
                        :stroke="coachData.score > 60 ? '#ef4444' : coachData.score > 30 ? '#f59e0b' : '#10b981'"
                        :stroke-dasharray="`${(coachData.score / 100) * 119.38} 119.38`"
                        class="transition-all duration-700" />
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums"
                      :class="coachData.score > 60 ? 'text-red-600 dark:text-red-400' : coachData.score > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'"
                      style="font-family: 'Space Grotesk', sans-serif;">{{ coachData.score }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <div class="w-1.5 h-1.5 rounded-full" :class="coachData.score > 60 ? 'bg-red-500' : coachData.score > 30 ? 'bg-amber-500' : 'bg-emerald-500'" />
                      <p class="text-[10px] font-bold uppercase tracking-wider"
                        :class="coachData.score > 60 ? 'text-red-600 dark:text-red-400' : coachData.score > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                        {{ lang.language.value === 'en' ? 'Risk Level' : 'Nivel de riesgo' }}
                      </p>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">{{ coachData.analysis }}</p>
                  </div>
                </div>

                <!-- Quick wins -->
                <div v-if="coachData.quick_wins?.length">
                  <div class="flex items-center gap-1.5 mb-2.5">
                    <UIcon name="i-heroicons-bolt" class="w-3.5 h-3.5 text-amber-500" />
                    <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{{ t.quickWins }}</p>
                  </div>
                  <div class="space-y-2">
                    <div v-for="(win, i) in coachData.quick_wins.slice(0, 3)" :key="i"
                      class="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-colors">
                      <div class="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <UIcon name="i-heroicons-check" class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span class="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{{ win }}</span>
                    </div>
                  </div>
                </div>

                <!-- Motivation quote -->
                <div v-if="coachData.motivation" class="relative p-3.5 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-500/8 dark:to-fuchsia-500/8 border border-violet-100 dark:border-violet-500/15">
                  <UIcon name="i-heroicons-sparkles" class="absolute top-3 right-3 w-4 h-4 text-violet-300 dark:text-violet-600" />
                  <p class="text-xs text-violet-800 dark:text-violet-200 font-medium italic leading-relaxed pr-5">"{{ coachData.motivation }}"</p>
                </div>
              </div>

              <!-- Empty state -->
              <div v-else class="space-y-4">
                <div class="flex items-start gap-3">
                  <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/25">
                    <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-white" />
                  </div>
                  <div class="bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/8 rounded-2xl rounded-tl-md p-3.5 flex-1">
                    <p class="text-sm text-gray-900 dark:text-gray-100 font-semibold">{{ lang.language.value === 'en' ? `Hey ${userName}!` : `Hola ${userName}!` }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{{ lang.language.value === 'en' ? "Let me analyze your workflow and find what's holding you back." : 'Permíteme analizar tu flujo de trabajo y encontrar qué te detiene.' }}</p>
                  </div>
                </div>
                <button @click="loadCoachAdvice"
                  class="w-full group relative bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:shadow-xl active:scale-[0.98]">
                  <span class="flex items-center justify-center gap-2">
                    <UIcon name="i-heroicons-sparkles" class="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    {{ t.analyzeNow }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </InspiraBlurReveal>

        <!-- ── Project Ranking ── -->
        <InspiraBlurReveal :delay="200" class="lg:col-span-1">
          <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100" style="letter-spacing: -0.32px;">{{ t.projectRanking }}</h3>
            </div>
            <div class="space-y-2">
              <NuxtLink v-for="(project, idx) in rankedProjects" :key="project.id"
                :to="`/${store.slug}/projects/${project.id}/kanban`"
                class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all group cursor-pointer">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: project.color + '20' }">
                  <UIcon name="i-heroicons-folder" class="w-4 h-4" :style="{ color: project.color }" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-500 transition-colors">{{ project.name }}</p>
                  <p class="text-[10px] text-gray-600 dark:text-gray-300">{{ project.taskCount || 0 }} {{ t.tasks }}</p>
                </div>
                <div class="flex items-center gap-1.5">
                  <div class="w-[50px] h-[5px] bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      :style="{ width: `${project.progress || 0}%` }" />
                  </div>
                  <span class="text-[10px] font-medium text-gray-600 dark:text-gray-300 tabular-nums w-6 text-right">{{ project.progress || 0 }}%</span>
                </div>
              </NuxtLink>
              <div v-if="rankedProjects.length === 0" class="text-center py-6">
                <p class="text-xs text-gray-600 dark:text-gray-300">{{ t.noProjects }}</p>
                <button @click="showCreate = true" class="mt-2 text-xs font-semibold text-emerald-500 hover:text-emerald-700 cursor-pointer">
                  + {{ t.createProject }}
                </button>
              </div>
            </div>
          </div>
        </InspiraBlurReveal>

        <!-- ── Right Column: AI Sessions + Lo-fi + Daily Plan ── -->
        <InspiraBlurReveal :delay="300" class="lg:col-span-1 space-y-4">
          <!-- AI Token Sessions Detail -->
          <div v-if="canViewUsageStats" class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ lang.language.value === 'en' ? "Today's Sessions" : 'Sesiones de hoy' }}</h3>
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] rounded-full px-2.5 py-0.5 cursor-pointer transition-colors"
                  :class="aiTab === 'overview' ? 'bg-[#0D0D0D] text-white dark:bg-white dark:text-[#0D0D0D]' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200'"
                  @click="aiTab = 'overview'">{{ t.general }}</span>
                <span class="text-[11px] rounded-full px-2.5 py-0.5 cursor-pointer transition-colors"
                  :class="aiTab === 'daily' ? 'bg-[#0D0D0D] text-white dark:bg-white dark:text-[#0D0D0D]' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200'"
                  @click="aiTab = 'daily'">{{ t.daily }}</span>
              </div>
            </div>
            <template v-if="tokenStats">
              <div v-if="aiTab === 'overview'" class="space-y-3">
                <div class="flex items-center gap-4">
                  <svg class="w-[70px] h-[70px] shrink-0" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" class="stroke-gray-200 dark:stroke-white/10" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#10B981" stroke-width="6"
                      :stroke-dasharray="213.63" :stroke-dashoffset="213.63 * (1 - tokenStats.percentUsed / 100)"
                      stroke-linecap="round" transform="rotate(-90 40 40)" class="transition-all duration-700" />
                    <text x="40" y="38" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor" class="text-gray-900 dark:text-gray-100" style="font-family: 'Space Grotesk'">{{ tokenStats.percentUsed }}%</text>
                    <text x="40" y="50" text-anchor="middle" font-size="8" fill="currentColor" class="text-gray-600 dark:text-gray-300">{{ lang.language.value === 'en' ? 'used' : 'usado' }}</text>
                  </svg>
                  <div class="space-y-2 flex-1">
                    <div v-for="(tokens, actionName) in topActions" :key="actionName">
                      <div class="flex items-center justify-between text-[10px] mb-0.5">
                        <span class="text-gray-600 dark:text-gray-300">{{ actionName }}</span>
                        <span class="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{{ formatTokens(tokens) }}</span>
                      </div>
                      <div class="h-[3px] bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${(tokens / tokenStats.totalTokens) * 100}%` }" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="space-y-3">
                <div>
                  <p class="text-[11px] text-gray-600 dark:text-gray-300">{{ t.today }}</p>
                  <span class="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums" style="font-family: 'Space Grotesk';">{{ formatTokens(todayTokens) }}</span>
                  <span v-if="todayTokens > yesterdayTokens && yesterdayTokens > 0" class="text-[11px] font-bold text-red-500 ml-2">
                    +{{ Math.round(((todayTokens - yesterdayTokens) / yesterdayTokens) * 100) }}%
                  </span>
                </div>
                <div class="flex items-end gap-1 h-[50px]">
                  <div v-for="(day, i) in last7Days" :key="i"
                    class="flex-1 rounded-sm transition-all duration-300"
                    :class="day.isToday ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/15'"
                    :style="{ height: `${day.height}%`, minHeight: day.tokens > 0 ? '4px' : '2px' }"
                    :title="`${day.date}: ${formatTokens(day.tokens)}`" />
                </div>
                <div class="flex justify-between text-[9px] text-gray-600 dark:text-gray-300">
                  <span>{{ lang.language.value === 'en' ? '7d ago' : '7d atrás' }}</span><span>{{ t.today }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="h-[70px] bg-gray-100 dark:bg-white/10 rounded-lg animate-pulse" />
            </template>
          </div>

          <!-- Lo-fi Player -->
          <div class="bg-gradient-to-br from-[#0d0d0d] to-[#1a1a2e] rounded-2xl border border-white/5 overflow-hidden">
            <div class="p-4">
              <div class="flex items-center gap-3">
                <button @click="lofi.toggle()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer shrink-0">
                  <span v-if="lofi.isLoading.value" class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <UIcon v-else :name="lofi.isPlaying.value ? 'i-heroicons-pause-solid' : 'i-heroicons-play-solid'" class="w-4 h-4 text-white" />
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-white truncate">{{ lofi.currentStation.value.emoji }} {{ lofi.currentStation.value.name }}</span>
                    <span v-if="lofi.isPlaying.value" class="flex gap-[2px] items-end h-3 shrink-0">
                      <span v-for="i in 3" :key="i" class="w-[2px] bg-emerald-400 rounded-full animate-pulse" :style="{ height: `${6 + (i * 3)}px`, animationDelay: `${i * 0.15}s` }" />
                    </span>
                  </div>
                  <p class="text-[10px] text-white/80 truncate">{{ lofi.currentQuote.value }}</p>
                </div>
                <button @click="lofi.skip()" class="text-white/80 hover:text-white transition-colors cursor-pointer shrink-0" :title="lang.language.value === 'en' ? 'Next station' : 'Siguiente estacion'">
                  <UIcon name="i-heroicons-forward" class="w-4 h-4" />
                </button>
                <button @click="showStationList = !showStationList" class="text-white/80 hover:text-white transition-colors cursor-pointer shrink-0" :title="lang.language.value === 'en' ? 'Station list' : 'Lista de estaciones'">
                  <UIcon :name="showStationList ? 'i-heroicons-chevron-up' : 'i-heroicons-queue-list'" class="w-4 h-4" />
                </button>
              </div>
              <div class="flex items-center gap-3 mt-2.5">
                <div class="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                    :style="{ width: lofi.isPlaying.value ? '60%' : '0%' }" />
                </div>
                <input type="range" min="0" max="100" :value="lofi.volume.value * 100"
                  @input="lofi.setVolume(($event.target as HTMLInputElement).valueAsNumber / 100)"
                  class="w-16 h-1 accent-emerald-400 cursor-pointer shrink-0" />
              </div>
            </div>

            <!-- Collapsible station list -->
            <Transition name="slide-up">
              <div v-if="showStationList" class="border-t border-white/5 max-h-[240px] overflow-y-auto">
                <button
                  v-for="station in lofi.stations" :key="station.id"
                  class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer"
                  :class="lofi.currentStationId.value === station.id ? 'bg-white/10' : ''"
                  @click="lofi.setStation(station.id); showStationList = false"
                >
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm" :style="{ backgroundColor: station.color + '25' }">
                    {{ station.emoji }}
                  </div>
                  <div class="flex-1 min-w-0 text-left">
                    <p class="text-xs font-medium text-white/90 truncate">{{ station.name }}</p>
                    <p class="text-[10px] text-white/40 truncate">{{ station.tracks[0]?.artist || 'Live Stream' }}</p>
                  </div>
                  <div v-if="lofi.currentStationId.value === station.id && lofi.isPlaying.value" class="flex gap-[2px] items-end h-3 shrink-0">
                    <span v-for="i in 3" :key="i" class="w-[2px] rounded-full animate-pulse" :style="{ height: `${4 + (i * 2)}px`, animationDelay: `${i * 0.15}s`, backgroundColor: station.color }" />
                  </div>
                  <UIcon v-else-if="lofi.currentStationId.value === station.id" name="i-heroicons-check" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </button>
              </div>
            </Transition>
          </div>

          <!-- Daily Plan -->
          <div v-if="canUseAI" class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card p-4 cursor-pointer hover:shadow-md transition-all group"
            @click="loadDailyPlan">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ t.dailyPlan }}</h3>
              <div class="w-7 h-7 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-violet-600" />
              </div>
            </div>
            <div v-if="dailyPlan">
              <p class="text-xs text-gray-900 dark:text-gray-100 font-medium mb-2">{{ dailyPlan.greeting }}</p>
              <div class="space-y-1">
                <div v-for="(task, i) in (dailyPlan.focus_tasks || []).slice(0, 3)" :key="i" class="flex items-start gap-1.5">
                  <span class="text-[10px] font-bold text-emerald-500 mt-0.5 tabular-nums">{{ Number(i) + 1 }}.</span>
                  <span class="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">{{ task }}</span>
                </div>
              </div>
            </div>
            <div v-else class="flex items-center gap-2 text-emerald-500">
              <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
              <span class="text-[11px] font-semibold">{{ t.generatePlan }}</span>
            </div>
          </div>
        </InspiraBlurReveal>
      </div>

      <!-- ═══════ QUICK ACTIONS BAR ═══════ -->
      <InspiraBlurReveal :delay="400">
        <div class="flex items-center gap-3">
          <button @click="router.push(`/${store.slug}/projects`)"
            class="bg-white dark:bg-[#1b1b1b] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-gray-100 text-xs font-semibold px-5 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 shadow-card transition-all cursor-pointer hover:shadow-md">
            {{ t.viewProjects }}
          </button>
          <button @click="showCreate = true"
            class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-500/25">
            + {{ t.newProject }}
          </button>
        </div>
      </InspiraBlurReveal>

    <!-- Quick create project modal -->
    <UModal v-model:open="showCreate">
      <template #content>
        <div class="p-6 bg-white dark:bg-[#1b1b1b]">
          <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">{{ t.newProject }}</h2>
          <form class="space-y-4" @submit.prevent="handleCreate">
            <UFormField :label="t.name">
              <UInput v-model="newName" :placeholder="lang.language.value === 'en' ? 'Project name' : 'Nombre del proyecto'" required class="w-full" size="lg" autofocus />
            </UFormField>
            <UFormField :label="lang.language.value === 'en' ? 'Kanban Template' : 'Plantilla Kanban'">
              <USelectMenu v-model="newTemplate" :items="templateOptions" value-key="value" class="w-full" />
            </UFormField>
            <p v-if="createError" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">{{ createError }}</p>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showCreate = false">{{ t.cancel }}</UButton>
              <UButton type="submit" color="primary" :loading="creating" class="font-semibold">{{ t.createProject }}</UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Procrastination Quiz Modal -->
    <ProcrastinationQuiz
      v-if="showQuiz && store.workspace?.id"
      :workspace-id="store.workspace.id"
      @close="showQuiz = false"
      @done="onQuizDone"
    />
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { TokenUsageStats } from '~/types'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const store = useWorkspaceStore()
const auth = useAuthStore()
const lofi = useLofiPlayer()
const showStationList = ref(false)
const pushNotif = usePushNotifications()
const deadline = useTaskDeadline()
const pomodoro = usePomodoroTimer()
const { canUseAI, canViewUsageStats } = usePermissions()
const lang = useLanguage()
const t = lang.labels

const taskCount = ref(0)
const completedTasks = ref(0)
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const newName = ref('')
const newTemplate = ref('simple')

// Assessment
const showQuiz = ref(false)
const assessmentScore = ref<number | null>(null)
const assessmentAnalysis = ref('')

async function loadAssessment() {
  if (!store.workspace?.id) return
  const justLoggedIn = sessionStorage.getItem('focusflow_just_logged_in')
  if (justLoggedIn) {
    sessionStorage.removeItem('focusflow_just_logged_in')
    // Always show quiz on fresh login
    setTimeout(() => { showQuiz.value = true }, 1500)
  }
  try {
    const data = await $fetch<any>(`/api/workspaces/${store.workspace.id}/assessment`)
    if (data) {
      assessmentScore.value = data.score
      assessmentAnalysis.value = data.ai_analysis || ''
    }
  } catch { /* silent */ }
}

function onQuizDone(score: number) {
  assessmentScore.value = score
  showQuiz.value = false
}

function retakeQuiz() {
  showQuiz.value = true
}

// Coach data
const coachLoading = ref(false)
const coachData = ref<any>(null)
const dailyPlan = ref<any>(null)

// Token stats
const tokenStats = ref<TokenUsageStats | null>(null)
const tokenLoading = ref(false)

// AI tab
const aiTab = ref<'overview' | 'daily'>('overview')

// Streak
const streak = ref(3)

// Pomodoro timer (singleton composable)
const pomodoroSeconds = pomodoro.seconds
const pomodoroRunning = pomodoro.running
const pomodoroPhase = pomodoro.phase
const pomodoroSessions = pomodoro.sessions

// Recent tasks for the table
const recentTasks = ref<any[]>([])

// Filters
const filterProjectId = ref('')
const filterPriority = ref('')
const filterStatus = ref('')
const showFilters = ref(false)

const filteredTasks = computed(() => {
  let tasks = recentTasks.value
  if (filterProjectId.value) {
    tasks = tasks.filter(t => t.projectId === filterProjectId.value)
  }
  if (filterPriority.value) {
    tasks = tasks.filter(t => t.priority === filterPriority.value)
  }
  if (filterStatus.value === 'done') {
    tasks = tasks.filter(t => t.isCompleted)
  } else if (filterStatus.value === 'progress') {
    tasks = tasks.filter(t => !t.isCompleted)
  }
  return tasks
})

// In-progress tasks
const inProgressTasks = computed(() => taskCount.value - completedTasks.value)

// Pomodoro ring (from composable)
const pomodoroRingOffset = pomodoro.ringOffset

// Stat bar heights
const statBarHeights = computed(() => {
  const seed = (n: number, offset: number) => {
    const vals = []
    for (let i = 0; i < 7; i++) {
      vals.push(20 + ((n * 7 + i * 13 + offset) % 60))
    }
    return vals
  }
  return {
    total: seed(taskCount.value, 0),
    progress: seed(inProgressTasks.value, 37),
    completed: seed(completedTasks.value, 71),
  }
})

// Project bar chart data (per-project task counts)
const projectBars = computed(() => {
  const projects = store.projects.slice(0, 5)
  const maxTasks = Math.max(...projects.map(p => (p as any)._taskCount || 1), 1)
  return projects.map(p => ({
    name: p.name,
    height: Math.max(((p as any)._taskCount || 10) / maxTasks * 100, 5),
  }))
})

// Ranked projects with progress
const rankedProjects = computed(() => {
  return store.projects.slice(0, 5).map(p => ({
    ...p,
    taskCount: (p as any)._taskCount || 0,
    progress: taskCount.value > 0 ? Math.round((completedTasks.value / taskCount.value) * 100) : 0,
  }))
})

const templateOptions = [
  { label: 'Simple (3 col)', value: 'simple' },
  { label: 'Kanban Clásico (5 col)', value: 'kanban' },
  { label: 'Dev IT (6 col)', value: 'dev' },
  { label: 'DevOps (8 col)', value: 'devops' },
  { label: 'Soporte (6 col)', value: 'support' },
  { label: 'Scrum (6 col)', value: 'scrum' },
  { label: 'Scrumban (8 col)', value: 'scrumban' },
  { label: 'Marketing (7 col)', value: 'marketing' },
  { label: 'Agentes AI (7 col)', value: 'ai_agents' },
  { label: 'Backend Senior Dev (9 col)', value: 'backend_senior_dev' },
  { label: 'Frontend & Design (8 col)', value: 'frontend_design' },
]

const userName = computed(() => {
  const email = auth.userEmail || ''
  return email.split('@')[0] || 'usuario'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t.value.goodMorning
  if (h < 18) return t.value.goodAfternoon
  return t.value.goodEvening
})

const motivationalQuotesEs = [
  '¿Listo para conquistar tus proyectos?',
  'Cada tarea completada es un paso hacia tu meta.',
  'Empieza por lo más pequeño, el momentum hará el resto.',
  'Tu yo del futuro te agradecerá empezar hoy.',
  'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.',
  'No esperes el momento perfecto. Toma el momento y hazlo perfecto.',
  'El progreso, no la perfección, es lo que importa.',
  'Pequeños pasos consistentes crean grandes resultados.',
  'Enfócate en el proceso, los resultados llegarán.',
  'Hoy es un gran día para hacer algo increíble.',
  'La productividad no se trata de estar ocupado, sino de ser efectivo.',
  'Cada minuto invertido en planificar ahorra diez en ejecución.',
  'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
  'No tienes que ser perfecto para empezar, pero tienes que empezar para ser perfecto.',
  'Tu único límite es tu mente. Rompe las barreras.',
  'La constancia supera al talento cuando el talento no es constante.',
]
const motivationalQuotesEn = [
  'Ready to conquer your projects?',
  'Every completed task is a step toward your goal.',
  'Start with the smallest thing, momentum will do the rest.',
  'Your future self will thank you for starting today.',
  'Discipline is choosing between what you want now and what you want most.',
  "Don't wait for the perfect moment. Take the moment and make it perfect.",
  'Progress, not perfection, is what matters.',
  'Small consistent steps create big results.',
  'Focus on the process, the results will follow.',
  'Today is a great day to do something amazing.',
  "Productivity isn't about being busy, it's about being effective.",
  'Every minute spent planning saves ten in execution.',
  'Success is the sum of small efforts repeated day after day.',
  "You don't have to be perfect to start, but you have to start to be perfect.",
  'Your only limit is your mind. Break the barriers.',
  'Consistency beats talent when talent is not consistent.',
]
const currentQuoteIndex = ref(0)
const quoteReady = ref(false)
onMounted(() => {
  currentQuoteIndex.value = Math.floor(Math.random() * motivationalQuotesEs.length)
  quoteReady.value = true
})
const motivationalQuote = computed(() => {
  if (!quoteReady.value) return '\u00A0'
  const quotes = lang.language.value === 'en' ? motivationalQuotesEn : motivationalQuotesEs
  return quotes[currentQuoteIndex.value % quotes.length]
})

let quoteInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  quoteInterval = setInterval(() => {
    currentQuoteIndex.value = (currentQuoteIndex.value + 1) % motivationalQuotesEs.length
  }, 5500)
})
onUnmounted(() => {
  if (quoteInterval) clearInterval(quoteInterval)
})

// Token stats computed
const topActions = computed(() => {
  if (!tokenStats.value?.byAction) return {}
  const sorted = Object.entries(tokenStats.value.byAction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
  return Object.fromEntries(sorted)
})

const todayStr = computed(() => new Date().toISOString().slice(0, 10))
const yesterdayStr = computed(() => new Date(Date.now() - 86400000).toISOString().slice(0, 10))

const todayTokens = computed(() => {
  if (!tokenStats.value?.byDay) return 0
  return tokenStats.value.byDay.find(d => d.date === todayStr.value)?.tokens || 0
})

const yesterdayTokens = computed(() => {
  if (!tokenStats.value?.byDay) return 0
  return tokenStats.value.byDay.find(d => d.date === yesterdayStr.value)?.tokens || 0
})

const last7Days = computed(() => {
  const days = []
  const byDayMap = new Map((tokenStats.value?.byDay || []).map(d => [d.date, d.tokens]))
  let maxTokens = 0
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const tokens = byDayMap.get(date) || 0
    if (tokens > maxTokens) maxTokens = tokens
    days.push({ date, tokens, isToday: i === 0 })
  }
  return days.map(d => ({
    ...d,
    height: maxTokens > 0 ? Math.max((d.tokens / maxTokens) * 100, 2) : 2,
  }))
})

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

const pomodoroDisplay = pomodoro.display
const togglePomodoro = pomodoro.togglePomodoro
const resetPomodoro = pomodoro.resetPomodoro

// Load token usage stats
async function loadTokenUsage() {
  if (!store.workspace?.id) return
  tokenLoading.value = true
  try {
    const data = await $fetch<TokenUsageStats>(`/api/workspaces/${store.workspace.id}/usage`)
    tokenStats.value = data
  } catch { /* silent */ }
  tokenLoading.value = false
}

// Load task stats + recent tasks
watch(() => store.workspace?.id, async (wsId) => {
  if (!wsId || store.projects.length === 0) return

  loadTokenUsage()
  loadAssessment()

  try {
    const stats = await $fetch<any>(`/api/workspaces/${wsId}/dashboard-stats`)
    taskCount.value = stats.taskCount || 0
    completedTasks.value = stats.completedTasks || 0

    if (stats.recentTasks) {
      recentTasks.value = stats.recentTasks.map((t: any) => {
        const dlInfo = deadline.getDeadlineInfo(t.due_date)
        return {
          id: t.id,
          title: t.title,
          priority: t.priority || 'medium',
          projectId: t.project_id,
          projectName: t.projectName || '—',
          dateShort: t.created_at ? format(new Date(t.created_at), 'MMM d', { locale: lang.language.value === 'en' ? enUS : es }) : '—',
          isCompleted: t.isCompleted,
          deadlineLabel: dlInfo?.label || null,
          deadlineColor: dlInfo?.colorClass || '',
          deadlineBg: dlInfo?.bgClass || '',
        }
      })
    }
  } catch (err) {
    console.warn('[dashboard] Error loading stats:', err)
  }
}, { immediate: true })

// AI Coach
async function loadCoachAdvice() {
  if (store.projects.length === 0) return
  coachLoading.value = true
  try {
    const project = store.projects[0]!
    const res = await $fetch<any>('/api/ai/assist', {
      method: 'POST',
      body: {
        action: 'anti_procrastination',
        context: {
          projectId: project.id,
          projectName: project.name,
        },
      },
    })
    if (res?.type === 'json' && res.data) {
      coachData.value = res.data
    }
  } catch { /* silent */ }
  coachLoading.value = false
}

async function loadDailyPlan() {
  if (store.projects.length === 0) return
  try {
    const project = store.projects[0]!
    const res = await $fetch<any>('/api/ai/assist', {
      method: 'POST',
      body: {
        action: 'daily_plan',
        context: { projectId: project.id },
      },
    })
    if (res?.type === 'json' && res.data) {
      dailyPlan.value = res.data
    }
  } catch { /* silent */ }
}

async function handleCreate() {
  createError.value = ''
  creating.value = true
  try {
    await store.createProject({ name: newName.value, kanban_template: newTemplate.value })
    showCreate.value = false
    newName.value = ''
  } catch (e: any) {
    createError.value = e.data?.message || 'Error al crear'
  } finally {
    creating.value = false
  }
}

// Deadline check: trigger every 15 min, deduplicated across tabs via localStorage lock
let deadlineCheckInterval: ReturnType<typeof setInterval> | null = null
const DEADLINE_LOCK_KEY = 'focusflow-deadline-check-ts'
const DEADLINE_INTERVAL_MS = 15 * 60 * 1000

async function triggerDeadlineCheck() {
  if (!store.workspace?.id) return
  try {
    const lastRun = Number(localStorage.getItem(DEADLINE_LOCK_KEY) || '0')
    if (Date.now() - lastRun < DEADLINE_INTERVAL_MS - 60_000) return
    localStorage.setItem(DEADLINE_LOCK_KEY, String(Date.now()))
  } catch {}
  try {
    const user = useSupabaseUser()
    await $fetch('/api/cron/check-deadlines', {
      method: 'POST',
      body: { userId: user.value?.id },
    })
  } catch {}
}

watch(() => store.workspace?.id, (id) => {
  if (id) {
    triggerDeadlineCheck()
    if (deadlineCheckInterval) clearInterval(deadlineCheckInterval)
    deadlineCheckInterval = setInterval(triggerDeadlineCheck, DEADLINE_INTERVAL_MS)
  }
}, { immediate: true })

onUnmounted(() => {
  if (deadlineCheckInterval) clearInterval(deadlineCheckInterval)
})
</script>

<style scoped>
.quote-fade-enter-active,
.quote-fade-leave-active {
  transition: all 0.5s ease;
}
.quote-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.quote-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
