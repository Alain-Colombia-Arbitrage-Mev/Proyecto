<template>
  <div class="min-h-screen bg-[#f6f6f6] dark:bg-[#111] transition-colors">
    <div class="p-4 sm:p-6 space-y-3 animate-fade-up">

      <!-- ═══════ WELCOME ═══════ -->
      <div class="mb-1 flex items-start justify-between gap-4">
        <div>
          <p class="text-base sm:text-[22px] text-[#7A7A7A] dark:text-[#99a0ae]" style="letter-spacing: -0.44px;">{{ motivationalQuote }}</p>
          <h1 class="text-[28px] md:text-[42px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-[1.2]" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2.52px;">
            {{ greeting }}, {{ userName }} <span>&#x1F44B;</span>
          </h1>
        </div>
        <LanguageToggle class="mt-2" />
      </div>

      <!-- ═══════ MAIN LAYOUT: Left+Center / Right ═══════ -->
      <div class="flex flex-col lg:flex-row gap-3">

        <!-- ─── LEFT + CENTER AREA ─── -->
        <div class="flex-1 min-w-0 space-y-3">

          <!-- 3 Stat Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <!-- Tareas Totales -->
            <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 min-h-[120px] sm:h-[143px] relative overflow-hidden">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ t.totalTasks }}</span>
                <UIcon name="i-heroicons-arrow-up-right" class="w-4 h-4 text-gray-400" />
              </div>
              <div class="flex items-end justify-between mt-auto">
                <span class="text-[32px] sm:text-[42px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2.52px;">{{ taskCount }}</span>
                <div class="flex items-end gap-[3px] h-[50px]">
                  <div v-for="i in 7" :key="'t-'+i" class="w-[8px] rounded-sm"
                    :class="i % 2 === 0 ? 'bg-[#10B981]' : 'bg-[#E8E8E8] dark:bg-white/15'"
                    :style="{ height: `${statBarHeights.total[i - 1]}%` }" />
                </div>
              </div>
            </div>

            <!-- En Progreso -->
            <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 min-h-[120px] sm:h-[143px] relative overflow-hidden">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ t.inProgress }}</span>
                <UIcon name="i-heroicons-arrow-up-right" class="w-4 h-4 text-gray-400" />
              </div>
              <div class="flex items-end justify-between mt-auto">
                <span class="text-[32px] sm:text-[42px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2.52px;">{{ inProgressTasks }}</span>
                <div class="flex items-end gap-[3px] h-[50px]">
                  <div v-for="i in 7" :key="'p-'+i" class="w-[8px] rounded-sm"
                    :class="i % 3 === 0 ? 'bg-[#10B981]' : 'bg-[#E8E8E8] dark:bg-white/15'"
                    :style="{ height: `${statBarHeights.progress[i - 1]}%` }" />
                </div>
              </div>
            </div>

            <!-- Completadas -->
            <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 min-h-[120px] sm:h-[143px] relative overflow-hidden">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ t.completed }}</span>
                <UIcon name="i-heroicons-arrow-up-right" class="w-4 h-4 text-gray-400" />
              </div>
              <div class="flex items-end justify-between mt-auto">
                <span class="text-[32px] sm:text-[42px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2.52px;">{{ completedTasks }}</span>
                <div class="flex items-end gap-[3px] h-[50px]">
                  <div v-for="i in 7" :key="'c-'+i" class="w-[8px] rounded-sm"
                    :class="i <= 4 ? 'bg-[#10B981]' : 'bg-[#E8E8E8] dark:bg-white/15'"
                    :style="{ height: `${statBarHeights.completed[i - 1]}%` }" />
                </div>
              </div>
            </div>
          </div>

          <!-- Assessment Score Card -->
          <div v-if="assessmentScore !== null" class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 flex items-center gap-4">
            <div class="relative w-14 h-14 shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke-width="5" class="stroke-gray-100 dark:stroke-white/10" />
                <circle cx="28" cy="28" r="22" fill="none" stroke-width="5" stroke-linecap="round"
                  :stroke="assessmentScore <= 30 ? '#10b981' : assessmentScore <= 60 ? '#f59e0b' : '#ef4444'"
                  :stroke-dasharray="`${(assessmentScore / 100) * 138} 138`" />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-sm font-bold"
                :class="assessmentScore <= 30 ? 'text-emerald-600 dark:text-emerald-400' : assessmentScore <= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'"
                style="font-family: 'Space Grotesk', sans-serif;">{{ assessmentScore }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-semibold text-gray-500 dark:text-[#99a0ae]">{{ t.procrastinationRisk }}</p>
              <p class="text-sm font-bold text-gray-900 dark:text-gray-100"
                :class="assessmentScore <= 30 ? 'text-emerald-600 dark:text-emerald-400' : assessmentScore <= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'">
                {{ assessmentScore <= 30 ? t.quizLowRisk : assessmentScore <= 60 ? t.quizModerateRisk : t.quizHighRisk }}
              </p>
              <p v-if="assessmentAnalysis" class="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{{ assessmentAnalysis }}</p>
            </div>
            <button
              class="text-[11px] font-semibold text-focusflow-600 dark:text-focusflow-400 hover:underline shrink-0"
              @click="retakeQuiz"
            >{{ t.quizRetake }}</button>
          </div>

          <!-- Project Overview + Token Usage / Pomodoro -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">

            <!-- Resumen de Proyectos (bar chart) -->
            <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 min-h-[301px]">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-[16px] font-semibold text-[#0D0D0D] dark:text-gray-100" style="letter-spacing: -0.32px;">{{ t.projectSummary }}</h3>
                <span class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae] bg-[#f6f6f6] dark:bg-gray-700 rounded-full px-3 py-1">{{ t.thisMonth }}</span>
              </div>
              <!-- Y axis labels + bars -->
              <div class="flex gap-2 mt-4">
                <div class="flex flex-col justify-between text-[12px] text-[#00000099] dark:text-[#99a0ae] h-[180px] pr-1">
                  <span>600</span><span>500</span><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
                </div>
                <div class="flex-1">
                  <!-- Grid lines -->
                  <div class="relative h-[180px] border-b border-gray-100 dark:border-white/10">
                    <div v-for="i in 6" :key="'gl-'+i" class="absolute w-full border-t border-gray-50 dark:border-white/5"
                      :style="{ top: `${(i - 1) * (100/6)}%` }" />
                    <!-- Bars -->
                    <div class="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full px-2">
                      <div v-for="(bar, idx) in projectBars" :key="idx" class="flex flex-col items-center gap-1" style="width: 40px;">
                        <div class="w-[28px] rounded-t-md transition-all duration-500"
                          :class="idx % 2 === 0 ? 'bg-[#0D0D0D] dark:bg-white/80' : 'bg-[#10B981]'"
                          :style="{ height: `${bar.height}%` }" />
                      </div>
                    </div>
                  </div>
                  <!-- X axis -->
                  <div class="flex justify-around mt-2 text-[14px] text-[#00000099] dark:text-[#99a0ae] font-medium" style="letter-spacing: -0.28px;">
                    <span>{{ lang.language.value === 'en' ? 'Jan' : 'Ene' }}</span><span>Feb</span><span>Mar</span><span>{{ lang.language.value === 'en' ? 'Apr' : 'Abr' }}</span><span>{{ lang.language.value === 'en' ? 'May' : 'May' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right sub-column: Token Usage + Pomodoro -->
            <div class="space-y-3">
              <!-- Uso de Tokens AI -->
              <div v-if="canViewUsageStats" class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 min-h-[164px]">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-[16px] font-semibold text-[#0D0D0D] dark:text-gray-100" style="letter-spacing: -0.32px;">{{ t.tokenUsage }}</h3>
                  <button @click="loadTokenUsage" class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae] bg-[#f6f6f6] dark:bg-gray-700 rounded-full px-3 py-1 hover:bg-gray-200 transition-colors cursor-pointer">
                    {{ tokenLoading ? '...' : t.update }}
                  </button>
                </div>
                <template v-if="tokenStats">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[12px] text-[#666d80] dark:text-[#99a0ae]">{{ lang.language.value === 'en' ? 'Tokens Used' : 'Tokens Usados' }}</p>
                      <div class="flex items-center gap-2">
                        <span class="text-[32px] font-bold text-[#0D0D0D] dark:text-gray-100 tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.92px;">{{ formatTokens(tokenStats.totalTokens) }}</span>
                        <span class="bg-[#ECFDF5] dark:bg-emerald-500/10 text-[#10B981] dark:text-emerald-400 text-[11px] font-medium px-2 py-1 rounded-full">{{ tokenStats.percentUsed }}%</span>
                      </div>
                      <!-- Token ring -->
                      <div class="flex items-center gap-3 mt-2">
                        <svg class="w-[50px] h-[50px]" viewBox="0 0 50 50">
                          <circle cx="25" cy="25" r="20" fill="none" stroke-width="4" class="stroke-[#E8E8E8] dark:stroke-white/10" />
                          <circle cx="25" cy="25" r="20" fill="none" stroke="#10B981" stroke-width="4"
                            :stroke-dasharray="125.66" :stroke-dashoffset="125.66 * (1 - (tokenStats.percentUsed / 100))"
                            stroke-linecap="round" transform="rotate(-90 25 25)" class="transition-all duration-700" />
                        </svg>
                        <div class="text-[11px] text-[#666d80] dark:text-[#99a0ae] space-y-0.5">
                          <p>{{ formatTokens(tokenStats.totalTokens) }} / {{ formatTokens(tokenStats.limit) }}</p>
                        </div>
                      </div>
                    </div>
                    <!-- Breakdown -->
                    <div class="space-y-1.5 text-right">
                      <div v-for="(tokens, actionName) in topActions" :key="actionName" class="flex items-center gap-2">
                        <span class="text-[11px] text-[#7A7A7A] dark:text-[#99a0ae] truncate max-w-[80px]">{{ actionName }}</span>
                        <span class="text-[11px] font-semibold text-[#0D0D0D] dark:text-gray-100 tabular-nums">{{ formatTokens(tokens) }}</span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />
                    <div class="space-y-2 flex-1">
                      <div class="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse w-1/3" />
                      <div class="h-3 bg-gray-100 dark:bg-white/10 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                </template>
              </div>

              <!-- Pomodoro Timer (inline layout matching design) -->
              <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 min-h-[127px]">
                <!-- Top row: Timer + Ring -->
                <div class="flex items-start gap-4">
                  <!-- Left: title + time + label -->
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-semibold text-[#0D0D0D] dark:text-gray-100">{{ t.pomodoroTimer }}</p>
                    <p class="text-[36px] sm:text-[48px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums mt-1" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -2px;">
                      {{ pomodoroDisplay }}
                    </p>
                    <p class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae] mt-1">
                      {{ pomodoroPhase === 'work' ? t.focusSession : t.breakTime }}
                    </p>
                    <p v-if="pomodoro.activeTask.value" class="text-[11px] text-emerald-600 font-medium mt-0.5 truncate">
                      {{ lang.language.value === 'en' ? 'Focused on' : 'Enfocado en' }}: {{ pomodoro.activeTask.value.title }}
                    </p>
                    <p v-else class="text-[11px] text-gray-400 mt-0.5">{{ lang.language.value === 'en' ? 'Free session' : 'Sesión libre' }}</p>
                  </div>
                  <!-- Center: Ring -->
                  <div class="relative shrink-0">
                    <svg class="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" class="stroke-[#E8E8E8] dark:stroke-white/10" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#10B981" stroke-width="6"
                        :stroke-dasharray="213.63" :stroke-dashoffset="pomodoroRingOffset"
                        stroke-linecap="round" transform="rotate(-90 40 40)"
                        class="transition-all duration-1000" />
                    </svg>
                    <button @click="togglePomodoro" class="absolute inset-0 flex items-center justify-center cursor-pointer">
                      <span class="text-[20px] text-[#10B981]">{{ pomodoroRunning ? '⏸' : '▶' }}</span>
                    </button>
                  </div>
                </div>
                <!-- Bottom row: Stats + Controls (always visible) -->
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-white/5">
                  <div class="flex items-center gap-4">
                    <div>
                      <p class="text-[11px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ lang.language.value === 'en' ? 'Sessions today' : 'Sesiones hoy' }}</p>
                      <p class="text-[14px] font-bold text-[#0D0D0D] dark:text-gray-100 tabular-nums">{{ pomodoroSessions }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ lang.language.value === 'en' ? 'Streak' : 'Racha' }}</p>
                      <p class="text-[14px] font-bold text-[#0D0D0D] dark:text-gray-100">{{ streak }} {{ lang.language.value === 'en' ? 'days' : 'dias' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click="togglePomodoro"
                      class="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
                      :class="pomodoroRunning ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-200' : 'bg-[#10B981] text-white hover:bg-emerald-600'"
                    >
                      {{ pomodoroRunning ? t.pause : t.start }}
                    </button>
                    <button
                      v-if="pushNotif.permission.value !== 'granted'"
                      @click="pushNotif.requestPermission()"
                      class="px-3 py-1 rounded-lg text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      {{ t.enableNotifications }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Task List + Ranking -->
          <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">

            <!-- Lista de Tareas (table) -->
            <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 overflow-hidden min-h-[269px]">
              <div class="flex items-center justify-between p-4 pb-2">
                <div class="flex items-center gap-3">
                  <h3 class="text-[16px] font-semibold text-[#0D0D0D] dark:text-gray-100" style="letter-spacing: -0.32px;">{{ t.board }}</h3>
                  <!-- Project dropdown selector -->
                  <select
                    v-model="filterProjectId"
                    class="text-[12px] font-medium text-[#0D0D0D] dark:text-gray-100 bg-[#f6f6f6] dark:bg-gray-700 rounded-full px-3 py-1 border-0 outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors appearance-none pr-6"
                    style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%237A7A7A%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 8px center; background-size: 14px;"
                  >
                    <option value="">{{ lang.language.value === 'en' ? 'All tasks' : 'Todas las tareas' }}</option>
                    <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <!-- Filtros button -->
                  <button
                    class="text-[12px] font-medium px-3 py-1 rounded-full transition-all cursor-pointer"
                    :class="showFilters ? 'bg-[#0D0D0D] dark:bg-white text-white dark:text-[#0D0D0D]' : 'text-[#7A7A7A] dark:text-[#99a0ae] bg-[#f6f6f6] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'"
                    @click="showFilters = !showFilters"
                  >
                    <span class="flex items-center gap-1">
                      <UIcon name="i-heroicons-funnel" class="w-3 h-3" />
                      {{ t.filters }}
                    </span>
                  </button>
                </div>
                <NuxtLink :to="`/${store.slug}/projects`" class="text-[12px] text-[#10B981] font-semibold hover:text-emerald-700 transition-colors">
                  {{ t.viewAll }}
                </NuxtLink>
              </div>
              <!-- Filter row -->
              <div v-if="showFilters" class="px-4 pb-2 flex items-center gap-2">
                <select
                  v-model="filterPriority"
                  class="text-[11px] font-medium text-[#7A7A7A] dark:text-[#99a0ae] bg-[#f6f6f6] dark:bg-gray-700 rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer"
                >
                  <option value="">{{ t.priority }}</option>
                  <option value="urgent">{{ t.priorityCritical }}</option>
                  <option value="high">{{ t.priorityHigh }}</option>
                  <option value="medium">{{ t.priorityMedium }}</option>
                  <option value="low">{{ t.priorityLow }}</option>
                </select>
                <select
                  v-model="filterStatus"
                  class="text-[11px] font-medium text-[#7A7A7A] dark:text-[#99a0ae] bg-[#f6f6f6] dark:bg-gray-700 rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer"
                >
                  <option value="">{{ t.status }}</option>
                  <option value="done">{{ t.done }}</option>
                  <option value="progress">{{ t.inProgress }}</option>
                </select>
                <button
                  v-if="filterPriority || filterStatus"
                  class="text-[11px] text-red-500 font-medium cursor-pointer hover:text-red-700"
                  @click="filterPriority = ''; filterStatus = ''"
                >
                  {{ lang.language.value === 'en' ? 'Clear' : 'Limpiar' }}
                </button>
              </div>
              <!-- Table header -->
              <div class="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] px-4 py-2 text-[12px] font-medium text-[#7A7A7A] dark:text-[#99a0ae] border-b border-gray-50 dark:border-white/5">
                <span>{{ t.name }}</span>
                <span class="hidden md:block">{{ t.project }}</span>
                <span>{{ t.date }}</span>
                <span class="hidden md:block">{{ t.status }}</span>
                <span>{{ t.priority }}</span>
                <span class="hidden md:block">{{ t.deadline }}</span>
              </div>
              <!-- Table rows -->
              <div v-if="filteredTasks.length > 0">
                <div v-for="task in filteredTasks" :key="task.id"
                  class="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] px-4 py-2.5 text-[12px] border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{{ task.title?.charAt(0)?.toUpperCase() }}</span>
                    </div>
                    <span class="text-[#0D0D0D] dark:text-gray-100 font-medium truncate">{{ task.title }}</span>
                  </div>
                  <span class="text-[#7A7A7A] dark:text-[#99a0ae] truncate hidden md:block">{{ task.projectName || '—' }}</span>
                  <span class="text-[#7A7A7A] dark:text-[#99a0ae]">{{ task.dateShort }}</span>
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
                    <span v-if="task.deadlineLabel"
                      class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      :class="task.deadlineBg + ' ' + task.deadlineColor">
                      {{ task.deadlineLabel }}
                    </span>
                    <span v-else class="text-[10px] text-gray-300">—</span>
                  </span>
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-10 text-[#7A7A7A] dark:text-[#99a0ae]">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-gray-300 mb-2" />
                <p class="text-[12px]">{{ recentTasks.length > 0 ? (lang.language.value === 'en' ? 'No results with these filters' : 'Sin resultados con estos filtros') : (lang.language.value === 'en' ? 'No recent tasks' : 'No hay tareas recientes') }}</p>
              </div>
            </div>

            <!-- Ranking de Proyectos -->
            <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 min-h-[269px]">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-[16px] font-semibold text-[#0D0D0D] dark:text-gray-100" style="letter-spacing: -0.32px;">{{ t.projectRanking }}</h3>
              </div>
              <div class="space-y-2">
                <NuxtLink
                  v-for="(project, idx) in rankedProjects"
                  :key="project.id"
                  :to="`/${store.slug}/projects/${project.id}/kanban`"
                  class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
                >
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ backgroundColor: project.color + '20' }">
                    <UIcon name="i-heroicons-folder" class="w-4 h-4" :style="{ color: project.color }" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-medium text-[#0D0D0D] dark:text-gray-100 truncate group-hover:text-[#10B981] transition-colors">{{ project.name }}</p>
                    <p class="text-[10px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ project.taskCount || 0 }} {{ t.tasks }}</p>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-[50px] h-[5px] bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div class="h-full bg-[#10B981] rounded-full transition-all duration-500"
                        :style="{ width: `${project.progress || 0}%` }" />
                    </div>
                    <span class="text-[10px] font-medium text-[#7A7A7A] dark:text-[#99a0ae] tabular-nums w-6 text-right">{{ project.progress || 0 }}%</span>
                  </div>
                </NuxtLink>
                <div v-if="rankedProjects.length === 0" class="text-center py-6">
                  <p class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ t.noProjects }}</p>
                  <button @click="showCreate = true" class="mt-2 text-[12px] font-semibold text-[#10B981] hover:text-emerald-700 cursor-pointer">
                    + {{ t.createProject }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── RIGHT COLUMN (fixed width, scrollable on mobile) ─── -->
        <div class="w-full lg:w-[396px] lg:shrink-0 space-y-3 overflow-visible">

          <!-- Coach Anti-Procrastinación -->
          <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 overflow-hidden">
            <div class="flex items-center justify-between p-4 pb-2">
              <h3 class="text-[16px] font-semibold text-[#0D0D0D] dark:text-gray-100">{{ t.antiProcrastination }}</h3>
              <span class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae] bg-[#f6f6f6] dark:bg-gray-700 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-200 transition-colors"
                @click="loadCoachAdvice">
                {{ coachLoading ? (lang.language.value === 'en' ? 'Analyzing...' : 'Analizando...') : t.update }}
              </span>
            </div>

            <div class="p-4 pt-2">
              <!-- Loading state -->
              <div v-if="coachLoading" class="space-y-3">
                <div class="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse w-3/4" />
                <div class="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse w-full" />
                <div class="h-4 bg-gray-100 dark:bg-white/10 rounded animate-pulse w-2/3" />
              </div>

              <!-- Coach content -->
              <div v-else-if="coachData" class="space-y-3">
                <div class="flex items-center gap-3 p-3 rounded-xl"
                  :class="coachData.score > 60 ? 'bg-red-50 dark:bg-red-500/10' : coachData.score > 30 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'">
                  <div class="text-2xl font-bold tabular-nums"
                    :class="coachData.score > 60 ? 'text-red-600 dark:text-red-400' : coachData.score > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                    {{ coachData.score }}
                  </div>
                  <div>
                    <p class="text-[12px] font-semibold text-[#0D0D0D] dark:text-gray-100">{{ lang.language.value === 'en' ? 'Procrastination risk' : 'Riesgo de procrastinación' }}</p>
                    <p class="text-[11px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ coachData.analysis }}</p>
                  </div>
                </div>
                <div v-if="coachData.quick_wins?.length">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-[#7A7A7A] dark:text-[#99a0ae] mb-2">{{ t.quickWins }}</p>
                  <div class="space-y-1.5">
                    <div v-for="(win, i) in coachData.quick_wins.slice(0, 3)" :key="i" class="flex items-start gap-2 text-[12px] text-[#0D0D0D] dark:text-gray-100">
                      <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>{{ win }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="coachData.motivation" class="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                  <p class="text-[12px] text-emerald-800 dark:text-emerald-300 font-medium italic">"{{ coachData.motivation }}"</p>
                </div>
              </div>

              <!-- Empty / AI Chat bubble style -->
              <div v-else class="space-y-3">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-[#0D0D0D] dark:bg-white/10 flex items-center justify-center shrink-0">
                    <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-white" />
                  </div>
                  <div class="bg-[#f6f6f6] dark:bg-white/5 rounded-2xl rounded-tl-sm p-3 flex-1">
                    <p class="text-[13px] text-[#0D0D0D] dark:text-gray-100 font-medium">{{ lang.language.value === 'en' ? `Good morning, ${userName}.` : `Buenos dias, ${userName}.` }}</p>
                    <p class="text-[12px] text-[#7A7A7A] dark:text-[#99a0ae] mt-1">{{ lang.language.value === 'en' ? "What's blocking you today?" : '¿Qué te está bloqueando hoy?' }}</p>
                  </div>
                </div>
                <button
                  @click="loadCoachAdvice"
                  class="w-full bg-[#10B981] hover:bg-emerald-600 text-white text-[12px] font-semibold py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  {{ t.analyzeNow }}
                </button>
              </div>
            </div>
          </div>

          <!-- AI Token Usage (detailed) -->
          <div v-if="canViewUsageStats" class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-[16px] font-semibold text-[#0D0D0D] dark:text-gray-100" style="letter-spacing: -0.32px;">{{ lang.language.value === 'en' ? "Today's Sessions" : 'Sesiones de hoy' }}</h3>
              <div class="flex items-center gap-2">
                <span
                  class="text-[12px] rounded-full px-3 py-1 cursor-pointer transition-colors"
                  :class="aiTab === 'overview' ? 'bg-[#0D0D0D] text-white dark:bg-white dark:text-[#0D0D0D]' : 'bg-[#f6f6f6] dark:bg-white/5 text-[#7A7A7A] dark:text-[#99a0ae] hover:bg-gray-200'"
                  @click="aiTab = 'overview'"
                >{{ t.general }}</span>
                <span
                  class="text-[12px] rounded-full px-3 py-1 cursor-pointer transition-colors"
                  :class="aiTab === 'daily' ? 'bg-[#0D0D0D] text-white dark:bg-white dark:text-[#0D0D0D]' : 'bg-[#f6f6f6] dark:bg-white/5 text-[#7A7A7A] dark:text-[#99a0ae] hover:bg-gray-200'"
                  @click="aiTab = 'daily'"
                >{{ t.daily }}</span>
              </div>
            </div>

            <template v-if="tokenStats">
              <!-- Overview tab -->
              <div v-if="aiTab === 'overview'" class="space-y-3">
                <div class="flex items-center gap-4">
                  <svg class="w-[80px] h-[80px] shrink-0" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke-width="6" class="stroke-[#E8E8E8] dark:stroke-white/10" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#10B981" stroke-width="6"
                      :stroke-dasharray="213.63" :stroke-dashoffset="213.63 * (1 - tokenStats.percentUsed / 100)"
                      stroke-linecap="round" transform="rotate(-90 40 40)" class="transition-all duration-700" />
                    <text x="40" y="38" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor" class="text-[#0D0D0D] dark:text-gray-100" style="font-family: 'Space Grotesk'">{{ tokenStats.percentUsed }}%</text>
                    <text x="40" y="50" text-anchor="middle" font-size="8" fill="currentColor" class="text-[#7A7A7A] dark:text-[#99a0ae]">{{ lang.language.value === 'en' ? 'used' : 'usado' }}</text>
                  </svg>
                  <div class="space-y-2 flex-1">
                    <div v-for="(tokens, actionName) in topActions" :key="actionName">
                      <div class="flex items-center justify-between text-[11px] mb-0.5">
                        <span class="text-[#7A7A7A] dark:text-[#99a0ae]">{{ actionName }}</span>
                        <span class="font-semibold text-[#0D0D0D] dark:text-gray-100 tabular-nums">{{ formatTokens(tokens) }}</span>
                      </div>
                      <div class="h-[3px] bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-[#10B981] rounded-full" :style="{ width: `${(tokens / tokenStats.totalTokens) * 100}%` }" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Daily tab -->
              <div v-else class="space-y-3">
                <div>
                  <p class="text-[11px] text-[#7A7A7A] dark:text-[#99a0ae]">{{ t.today }}</p>
                  <span class="text-[28px] font-bold text-[#0D0D0D] dark:text-gray-100 tabular-nums" style="font-family: 'Space Grotesk';">{{ formatTokens(todayTokens) }}</span>
                  <span v-if="todayTokens > yesterdayTokens && yesterdayTokens > 0" class="text-[11px] font-bold text-red-500 ml-2">
                    +{{ Math.round(((todayTokens - yesterdayTokens) / yesterdayTokens) * 100) }}%
                  </span>
                </div>
                <div class="flex items-end gap-1 h-[60px]">
                  <div v-for="(day, i) in last7Days" :key="i"
                    class="flex-1 rounded-sm transition-all duration-300"
                    :class="day.isToday ? 'bg-[#10B981]' : 'bg-gray-200 dark:bg-white/15'"
                    :style="{ height: `${day.height}%`, minHeight: day.tokens > 0 ? '4px' : '2px' }"
                    :title="`${day.date}: ${formatTokens(day.tokens)}`" />
                </div>
                <div class="flex justify-between text-[9px] text-[#7A7A7A] dark:text-[#99a0ae]">
                  <span>{{ lang.language.value === 'en' ? '7d ago' : '7d atrás' }}</span><span>{{ t.today }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="space-y-2">
                <div class="h-[80px] bg-gray-100 dark:bg-white/10 rounded-lg animate-pulse" />
              </div>
            </template>
          </div>

          <!-- Lo-fi Music Player (dark) -->
          <div class="bg-[#0D0D0D] rounded-[15px] p-3 border border-[#1F1F1F]">
            <div class="flex items-center gap-3">
              <!-- Play/Pause -->
              <button @click="lofi.toggle()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer shrink-0">
                <span v-if="lofi.isLoading.value" class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <UIcon v-else :name="lofi.isPlaying.value ? 'i-heroicons-pause-solid' : 'i-heroicons-play-solid'" class="w-4 h-4 text-white" />
              </button>
              <!-- Station info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[12px] font-semibold text-white truncate">{{ lofi.currentStation.value.emoji }} {{ lofi.currentStation.value.name }}</span>
                  <span v-if="lofi.isPlaying.value" class="flex gap-[2px] items-end h-3 shrink-0">
                    <span v-for="i in 3" :key="i" class="w-[2px] bg-[#10B981] rounded-full animate-pulse" :style="{ height: `${6 + (i * 3)}px`, animationDelay: `${i * 0.15}s` }" />
                  </span>
                </div>
                <p class="text-[10px] text-white/50 truncate">{{ lofi.currentQuote.value }}</p>
              </div>
              <!-- Skip -->
              <button @click="lofi.skip()" class="text-white/50 hover:text-white transition-colors cursor-pointer shrink-0">
                <UIcon name="i-heroicons-forward" class="w-4 h-4" />
              </button>
            </div>
            <!-- Volume + Progress row -->
            <div class="flex items-center gap-3 mt-2">
              <div class="flex-1 h-[3px] bg-[#374151] rounded-full overflow-hidden">
                <div class="h-full bg-[#10B981] rounded-full transition-all duration-1000"
                  :style="{ width: lofi.isPlaying.value ? '60%' : '0%' }" />
              </div>
              <input type="range" min="0" max="100" :value="lofi.volume.value * 100"
                @input="lofi.setVolume(($event.target as HTMLInputElement).valueAsNumber / 100)"
                class="w-16 h-1 accent-[#10B981] cursor-pointer shrink-0" />
            </div>
          </div>

          <!-- Daily Plan (compact) -->
          <div v-if="canUseAI" class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-4 cursor-pointer hover:shadow-sm transition-all"
            @click="loadDailyPlan">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-[14px] font-semibold text-[#0D0D0D] dark:text-gray-100">{{ t.dailyPlan }}</h3>
              <div class="w-6 h-6 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-violet-600" />
              </div>
            </div>
            <div v-if="dailyPlan">
              <p class="text-[12px] text-[#0D0D0D] dark:text-gray-100 font-medium mb-2">{{ dailyPlan.greeting }}</p>
              <div class="space-y-1">
                <div v-for="(task, i) in (dailyPlan.focus_tasks || []).slice(0, 3)" :key="i" class="flex items-start gap-1.5">
                  <span class="text-[10px] font-bold text-[#10B981] mt-0.5 tabular-nums">{{ Number(i) + 1 }}.</span>
                  <span class="text-[11px] text-[#7A7A7A] dark:text-[#99a0ae] leading-snug">{{ task }}</span>
                </div>
              </div>
            </div>
            <div v-else class="flex items-center gap-2 text-[#10B981]">
              <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
              <span class="text-[11px] font-semibold">{{ t.generatePlan }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════ QUICK ACTIONS BAR ═══════ -->
      <div class="flex items-center gap-3">
        <button
          @click="router.push(`/${store.slug}/projects`)"
          class="bg-white dark:bg-[#1b1b1b] hover:bg-gray-50 dark:hover:bg-white/5 text-[#0D0D0D] dark:text-gray-100 text-[12px] font-semibold px-4 py-2 rounded-lg border border-gray-100 dark:border-white/10 transition-all cursor-pointer"
        >
          {{ t.viewProjects }}
        </button>
        <button
          @click="showCreate = true"
          class="bg-[#10B981] hover:bg-emerald-600 text-white text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer"
        >
          + {{ t.newProject }}
        </button>
      </div>
    </div>

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
  try {
    const data = await $fetch<any>(`/api/workspaces/${store.workspace.id}/assessment`)
    if (data) {
      assessmentScore.value = data.score
      assessmentAnalysis.value = data.ai_analysis || ''
    } else {
      // No assessment yet — show quiz after a short delay
      setTimeout(() => { showQuiz.value = true }, 1500)
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
    height: Math.max(((p as any)._taskCount || Math.floor(Math.random() * 50 + 10)) / maxTasks * 100, 5),
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
]
const motivationalQuotesEn = [
  'Ready to conquer your projects?',
  'Every completed task is a step toward your goal.',
  'Start with the smallest thing, momentum will do the rest.',
  'Your future self will thank you for starting today.',
  'Discipline is choosing between what you want now and what you want most.',
]
const motivationalQuote = computed(() => {
  const quotes = lang.language.value === 'en' ? motivationalQuotesEn : motivationalQuotesEs
  return quotes[new Date().getDate() % quotes.length]
})

// Token stats computed
const topActions = computed(() => {
  if (!tokenStats.value?.byAction) return {}
  const sorted = Object.entries(tokenStats.value.byAction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
  return Object.fromEntries(sorted)
})

const todayStr = new Date().toISOString().slice(0, 10)
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

const todayTokens = computed(() => {
  if (!tokenStats.value?.byDay) return 0
  return tokenStats.value.byDay.find(d => d.date === todayStr)?.tokens || 0
})

const yesterdayTokens = computed(() => {
  if (!tokenStats.value?.byDay) return 0
  return tokenStats.value.byDay.find(d => d.date === yesterdayStr)?.tokens || 0
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
    const supabase = useSupabaseClient()
    const projectIds = store.projects.map(p => p.id)
    if (projectIds.length === 0) return

    const { count: total, error: totalErr } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
    if (!totalErr) taskCount.value = total || 0

    // Get completed tasks (last column of each project)
    const { data: cols, error: colsErr } = await supabase
      .from('kanban_columns')
      .select('id, project_id, position')
      .in('project_id', projectIds)
      .order('position', { ascending: false })

    if (!colsErr && cols && cols.length > 0) {
      const lastCols = new Map<string, string>()
      for (const col of cols as any[]) {
        if (!lastCols.has(col.project_id)) lastCols.set(col.project_id, col.id)
      }
      const lastColIds = Array.from(lastCols.values())
      if (lastColIds.length > 0) {
        const { count: done } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('column_id', lastColIds)
        completedTasks.value = done || 0
      }
    }

    // Load recent tasks for the table
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, priority, created_at, column_id, project_id, due_date')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(20)

    if (tasks) {
      const projectMap = new Map(store.projects.map(p => [p.id, p.name]))
      const lastColSet = new Set(cols ? Array.from(new Map(cols.map((c: any) => [c.project_id, c.id]) as any).values()) : [])

      recentTasks.value = tasks.map((t: any) => {
        const dlInfo = deadline.getDeadlineInfo(t.due_date)
        return {
          id: t.id,
          title: t.title,
          priority: t.priority || 'medium',
          projectId: t.project_id,
          projectName: projectMap.get(t.project_id) || '—',
          dateShort: t.created_at ? format(new Date(t.created_at), 'MMM d', { locale: lang.language.value === 'en' ? enUS : es }) : '—',
          isCompleted: lastColSet.has(t.column_id),
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
  // Tab dedup: skip if another tab ran the check within the last 14 min
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
