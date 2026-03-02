<template>
  <div>
    <!-- Bento Grid Dashboard — PlanIQ Style -->
    <div class="space-y-4 animate-fade-up">

      <!-- ═══════ ROW 1: Welcome + Quick Stats ═══════ -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <!-- Welcome Card — spans 2 cols -->
        <div class="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden hover:shadow-md transition-all duration-200">
          <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-12 translate-x-12" />
          <div class="absolute bottom-0 left-0 w-20 h-20 bg-emerald-50 rounded-full translate-y-8 -translate-x-8" />
          <div class="relative z-10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{{ todayFormatted }}</p>
            <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ greeting }}, {{ userName }} <span class="text-2xl">👋</span></h1>
            <p class="text-sm text-gray-500">{{ motivationalQuote }}</p>
            <div class="flex items-center gap-3 mt-5">
              <button
                @click="router.push(`/${store.slug}/projects`)"
                class="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Ver proyectos
              </button>
              <button
                @click="showCreate = true"
                class="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer"
              >
                + Nuevo proyecto
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          @click="router.push(`/${store.slug}/projects`)"
        >
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Resumen</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">Proyectos</span>
              <span class="text-lg font-bold text-gray-900 tabular-nums">{{ store.projects.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">Total tareas</span>
              <span class="text-lg font-bold text-gray-900 tabular-nums">{{ taskCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">Completadas</span>
              <div class="flex items-center gap-1.5">
                <span class="text-lg font-bold text-emerald-600 tabular-nums">{{ completedTasks }}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                  {{ taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0 }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════ ROW 2: Stat Cards (3 in a row) ═══════ -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Tareas Totales -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tareas Totales</span>
            <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div class="flex items-end justify-between">
            <div>
              <p class="text-4xl font-bold text-gray-900 tabular-nums leading-none" style="font-family: 'Space Grotesk', sans-serif;">{{ taskCount }}</p>
              <p class="text-[11px] text-gray-400 mt-1">en todos los proyectos</p>
            </div>
            <div class="flex items-end gap-0.5 h-10 w-20">
              <div v-for="i in 7" :key="'total-'+i" class="flex-1 rounded-sm bg-blue-500/20"
                :style="{ height: `${statBarHeights.total[i - 1]}%` }" />
            </div>
          </div>
        </div>

        <!-- En Progreso -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">En Progreso</span>
            <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div class="flex items-end justify-between">
            <div>
              <p class="text-4xl font-bold text-gray-900 tabular-nums leading-none" style="font-family: 'Space Grotesk', sans-serif;">{{ inProgressTasks }}</p>
              <p class="text-[11px] text-gray-400 mt-1">tareas activas</p>
            </div>
            <div class="flex items-end gap-0.5 h-10 w-20">
              <div v-for="i in 7" :key="'prog-'+i" class="flex-1 rounded-sm bg-amber-500/20"
                :style="{ height: `${statBarHeights.progress[i - 1]}%` }" />
            </div>
          </div>
        </div>

        <!-- Completadas -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Completadas</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div class="flex items-end justify-between">
            <div>
              <p class="text-4xl font-bold text-emerald-600 tabular-nums leading-none" style="font-family: 'Space Grotesk', sans-serif;">{{ completedTasks }}</p>
              <p class="text-[11px] text-gray-400 mt-1">{{ taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0 }}% del total</p>
            </div>
            <div class="flex items-end gap-0.5 h-10 w-20">
              <div v-for="i in 7" :key="'done-'+i" class="flex-1 rounded-sm bg-emerald-500/20"
                :style="{ height: `${statBarHeights.completed[i - 1]}%` }" />
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════ ROW 3: Coach + Pomodoro ═══════ -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <!-- Anti-Procrastination Coach — spans 2 cols -->
        <div class="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div class="p-5 border-b border-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <UIcon name="i-heroicons-fire" class="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-900">Coach Anti-Procrastinación</h3>
                  <p class="text-[10px] text-gray-400">Análisis personalizado con IA</p>
                </div>
              </div>
              <button
                @click="loadCoachAdvice"
                :disabled="coachLoading"
                class="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {{ coachLoading ? 'Analizando...' : 'Actualizar' }}
              </button>
            </div>
          </div>

          <div class="p-5">
            <div v-if="coachLoading" class="space-y-3">
              <div class="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div class="h-4 bg-gray-100 rounded animate-pulse w-full" />
              <div class="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
              <div class="h-10 bg-gray-100 rounded-lg animate-pulse mt-4" />
            </div>

            <div v-else-if="coachData" class="space-y-4">
              <!-- Risk Score -->
              <div class="flex items-center gap-3 p-3 rounded-xl"
                :class="coachData.score > 60 ? 'bg-red-50' : coachData.score > 30 ? 'bg-amber-50' : 'bg-emerald-50'"
              >
                <div class="text-2xl font-bold tabular-nums"
                  :class="coachData.score > 60 ? 'text-red-600' : coachData.score > 30 ? 'text-amber-600' : 'text-emerald-600'"
                >
                  {{ coachData.score }}
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-700">Riesgo de procrastinación</p>
                  <p class="text-[10px] text-gray-500">{{ coachData.analysis }}</p>
                </div>
              </div>

              <!-- Quick Wins -->
              <div v-if="coachData.quick_wins?.length">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Victorias rápidas (&lt; 15 min)</p>
                <div class="space-y-1.5">
                  <div v-for="(win, i) in coachData.quick_wins" :key="i" class="flex items-start gap-2 text-xs text-gray-700">
                    <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{{ win }}</span>
                  </div>
                </div>
              </div>

              <!-- Techniques -->
              <div v-if="coachData.techniques?.length">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Técnicas recomendadas</p>
                <div class="space-y-2">
                  <div v-for="(tech, i) in coachData.techniques" :key="i" class="p-2.5 bg-gray-50 rounded-lg">
                    <p class="text-xs font-semibold text-gray-800">{{ tech.name }}</p>
                    <p class="text-[11px] text-gray-500 mt-0.5">{{ tech.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Motivation -->
              <div v-if="coachData.motivation" class="p-3 bg-emerald-50 rounded-xl">
                <p class="text-xs text-emerald-800 font-medium italic">"{{ coachData.motivation }}"</p>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p class="text-xs text-gray-400">Selecciona un proyecto para recibir coaching</p>
              <button
                v-if="store.projects.length > 0"
                @click="loadCoachAdvice"
                class="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                Analizar ahora
              </button>
            </div>
          </div>
        </div>

        <!-- Pomodoro Timer with SVG Ring -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pomodoro</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div class="flex flex-col items-center">
            <!-- SVG Circular Ring -->
            <div class="relative mb-3">
              <svg class="w-28 h-28" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" stroke-width="5" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#10B981" stroke-width="5"
                  stroke-dasharray="282.7" :stroke-dashoffset="pomodoroRingOffset"
                  stroke-linecap="round" transform="rotate(-90 50 50)"
                  class="transition-all duration-1000" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl font-bold text-gray-900 tabular-nums" style="font-family: 'Space Grotesk', sans-serif;">
                  {{ pomodoroDisplay }}
                </span>
              </div>
            </div>

            <p class="text-[11px] font-medium text-gray-500 mb-3">
              {{ pomodoroPhase === 'work' ? 'Sesión de enfoque' : 'Descanso' }}
            </p>

            <!-- Controls -->
            <div class="flex items-center gap-2 mb-4">
              <button
                @click="togglePomodoro"
                class="px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                :class="pomodoroRunning
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'"
              >
                {{ pomodoroRunning ? 'Pausar' : 'Iniciar' }}
              </button>
              <button
                @click="resetPomodoro"
                class="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
              </button>
            </div>

            <!-- Pomodoro Stats -->
            <div class="w-full border-t border-gray-100 pt-3 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-gray-400">Sesiones hoy</span>
                <span class="text-[11px] font-bold text-gray-700 tabular-nums">{{ pomodoroSessions }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-gray-400">Racha</span>
                <span class="text-[11px] font-bold text-gray-700">🔥 {{ streak }} días</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-gray-400">Minutos hoy</span>
                <span class="text-[11px] font-bold text-gray-700 tabular-nums">{{ pomodoroSessions * 25 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════ ROW 4: Token Usage + AI Stats ═══════ -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- Token Usage Card -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Token Usage</span>
            <button
              @click="loadTokenUsage"
              class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center hover:bg-violet-100 transition-colors cursor-pointer"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-violet-600" :class="{ 'animate-spin': tokenLoading }" />
            </button>
          </div>

          <template v-if="tokenStats">
            <!-- Circular-style progress -->
            <div class="flex items-end gap-2 mb-2">
              <span class="text-4xl font-bold text-gray-900 tabular-nums leading-none">{{ tokenStats.percentUsed }}%</span>
            </div>
            <p class="text-[11px] text-gray-500 mb-3">{{ formatTokens(tokenStats.totalTokens) }} / {{ formatTokens(tokenStats.limit) }} tokens</p>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                :class="tokenStats.percentUsed >= 90 ? 'bg-red-500' : tokenStats.percentUsed >= 70 ? 'bg-amber-500' : 'bg-emerald-500'"
                :style="{ width: `${Math.min(tokenStats.percentUsed, 100)}%` }"
              />
            </div>

            <!-- Top actions breakdown -->
            <div class="space-y-1.5">
              <div v-for="(tokens, actionName) in topActions" :key="actionName" class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-violet-400 rounded-full" :style="{ width: `${(tokens / tokenStats.totalTokens) * 100}%` }" />
                </div>
                <span class="text-[10px] text-gray-500 w-16 text-right tabular-nums">{{ formatTokens(tokens) }}</span>
                <span class="text-[10px] text-gray-400 truncate w-20">{{ actionName }}</span>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="text-center py-4">
              <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p class="text-[11px] text-gray-400">Cargando uso de tokens...</p>
            </div>
          </template>
        </div>

        <!-- AI Token Stats Card -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Stats</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <template v-if="tokenStats">
            <div class="space-y-3">
              <div>
                <p class="text-[10px] text-gray-400 mb-1">Hoy</p>
                <span class="text-2xl font-bold text-gray-900 tabular-nums">{{ formatTokens(todayTokens) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <p class="text-[10px] text-gray-400">Ayer:</p>
                <span class="text-xs font-bold text-gray-600 tabular-nums">{{ formatTokens(yesterdayTokens) }}</span>
                <span v-if="todayTokens > yesterdayTokens && yesterdayTokens > 0" class="text-[10px] font-bold text-red-500">
                  +{{ Math.round(((todayTokens - yesterdayTokens) / yesterdayTokens) * 100) }}%
                </span>
                <span v-else-if="yesterdayTokens > todayTokens && todayTokens > 0" class="text-[10px] font-bold text-emerald-500">
                  -{{ Math.round(((yesterdayTokens - todayTokens) / yesterdayTokens) * 100) }}%
                </span>
              </div>
              <!-- Mini bar chart for last 7 days -->
              <div class="flex items-end gap-1 h-12 mt-2">
                <div
                  v-for="(day, i) in last7Days"
                  :key="i"
                  class="flex-1 rounded-sm transition-all duration-300"
                  :class="day.isToday ? 'bg-emerald-500' : 'bg-gray-200'"
                  :style="{ height: `${day.height}%`, minHeight: day.tokens > 0 ? '4px' : '2px' }"
                  :title="`${day.date}: ${formatTokens(day.tokens)}`"
                />
              </div>
              <div class="flex justify-between text-[9px] text-gray-400">
                <span>7d ago</span>
                <span>Hoy</span>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="space-y-2">
              <div class="h-8 bg-gray-100 rounded animate-pulse" />
              <div class="h-12 bg-gray-100 rounded animate-pulse" />
            </div>
          </template>
        </div>
      </div>

      <!-- ═══════ ROW 5: Recent Projects + Daily Plan + Streak ═══════ -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">

        <!-- Recent Projects — spans 2 cols -->
        <div class="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between p-5 pb-3">
            <h3 class="text-sm font-bold text-gray-900">Proyectos recientes</h3>
            <NuxtLink
              :to="`/${store.slug}/projects`"
              class="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
            >
              Ver todos
            </NuxtLink>
          </div>

          <div v-if="store.projects.length > 0" class="px-5 pb-5">
            <div class="space-y-2">
              <NuxtLink
                v-for="project in recentProjects"
                :key="project.id"
                :to="`/${store.slug}/projects/${project.id}/kanban`"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-150 group cursor-pointer"
              >
                <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: project.color + '15' }"
                >
                  <UIcon name="i-heroicons-folder" class="w-4 h-4" :style="{ color: project.color }" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                    {{ project.name }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{{ project.status }}</span>
                    <span class="text-[10px] text-gray-400">{{ project.description?.slice(0, 40) || 'Sin descripción' }}</span>
                  </div>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" />
              </NuxtLink>
            </div>
          </div>

          <div v-else class="px-5 pb-5 text-center py-6">
            <UIcon name="i-heroicons-folder-open" class="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p class="text-xs text-gray-400 mb-3">Aún no tienes proyectos</p>
            <UButton size="sm" color="primary" @click="showCreate = true" class="font-semibold">Crear proyecto</UButton>
          </div>
        </div>

        <!-- Daily Plan Card -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          @click="loadDailyPlan"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Plan del día</span>
            <div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <div v-if="dailyPlan">
            <p class="text-xs text-gray-700 font-medium mb-2">{{ dailyPlan.greeting }}</p>
            <div class="space-y-1.5">
              <div v-for="(task, i) in (dailyPlan.focus_tasks || []).slice(0, 3)" :key="i" class="flex items-start gap-1.5">
                <span class="text-[10px] font-bold text-emerald-600 mt-0.5 tabular-nums">{{ Number(i) + 1 }}.</span>
                <span class="text-[11px] text-gray-600 leading-snug">{{ task }}</span>
              </div>
            </div>
          </div>
          <div v-else>
            <p class="text-xs text-gray-400">Genera tu plan diario con IA</p>
            <div class="mt-2 flex items-center gap-1 text-emerald-600">
              <UIcon name="i-heroicons-sparkles" class="w-3 h-3" />
              <span class="text-[10px] font-semibold">Click para generar</span>
            </div>
          </div>
        </div>

        <!-- Streak / Consistency Tracker -->
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Racha</span>
            <div class="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <UIcon name="i-heroicons-fire" class="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div class="text-center">
            <span class="text-3xl font-bold text-gray-900 tabular-nums">{{ streak }}</span>
            <p class="text-[10px] text-gray-400 mt-1">días consecutivos productivo</p>
            <div class="flex items-center justify-center gap-1 mt-3">
              <div v-for="day in 7" :key="day"
                class="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold"
                :class="day <= streak % 7 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'"
              >
                {{ ['L','M','X','J','V','S','D'][(day - 1) % 7] }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Quick create project modal -->
    <UModal v-model:open="showCreate">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-5">Nuevo proyecto</h2>
          <form class="space-y-4" @submit.prevent="handleCreate">
            <UFormField label="Nombre">
              <UInput v-model="newName" placeholder="Nombre del proyecto" required class="w-full" size="lg" autofocus />
            </UFormField>
            <UFormField label="Plantilla Kanban">
              <USelectMenu v-model="newTemplate" :items="templateOptions" value-key="value" class="w-full" />
            </UFormField>
            <p v-if="createError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ createError }}</p>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showCreate = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="creating" class="font-semibold">Crear</UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TokenUsageStats } from '~/types'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const store = useWorkspaceStore()
const auth = useAuthStore()

const taskCount = ref(0)
const completedTasks = ref(0)
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const newName = ref('')
const newTemplate = ref('simple')

// Coach data
const coachLoading = ref(false)
const coachData = ref<any>(null)
const dailyPlan = ref<any>(null)

// Token stats
const tokenStats = ref<TokenUsageStats | null>(null)
const tokenLoading = ref(false)

// Focus score
const focusScore = ref(72)

// Streak (local for now)
const streak = ref(3)

// Pomodoro timer
const pomodoroSeconds = ref(25 * 60)
const pomodoroRunning = ref(false)
const pomodoroPhase = ref<'work' | 'break'>('work')
const pomodoroSessions = ref(0)
let pomodoroInterval: ReturnType<typeof setInterval> | null = null

// In-progress tasks (derived)
const inProgressTasks = computed(() => taskCount.value - completedTasks.value)

// Pomodoro SVG ring computed
const pomodoroTotal = computed(() => pomodoroPhase.value === 'work' ? 25 * 60 : 5 * 60)
const pomodoroRingOffset = computed(() => {
  const progress = pomodoroSeconds.value / pomodoroTotal.value
  return 282.7 * (1 - progress)
})

// Decorative stat bar heights (seeded from task counts so they look consistent)
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

const templateOptions = [
  { label: 'Simple (3 col)', value: 'simple' },
  { label: 'Dev IT (6 col)', value: 'dev' },
  { label: 'Soporte (5 col)', value: 'support' },
  { label: 'Scrum (5 col)', value: 'scrum' },
]

const recentProjects = computed(() => store.projects.slice(0, 5))

const userName = computed(() => {
  const email = auth.userEmail || ''
  return email.split('@')[0] || 'usuario'
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

const todayFormatted = computed(() => {
  try { return format(new Date(), "EEEE d 'de' MMMM", { locale: es }) } catch { return '' }
})

const motivationalQuotes = [
  'El progreso, no la perfección, es lo que importa.',
  'Cada tarea completada es un paso hacia tu meta.',
  'Empieza por lo más pequeño, el momentum hará el resto.',
  'Tu yo del futuro te agradecerá empezar hoy.',
  'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.',
]
const motivationalQuote = computed(() => motivationalQuotes[new Date().getDate() % motivationalQuotes.length])

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

const pomodoroDisplay = computed(() => {
  const m = Math.floor(pomodoroSeconds.value / 60)
  const s = pomodoroSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function togglePomodoro() {
  if (pomodoroRunning.value) {
    if (pomodoroInterval) clearInterval(pomodoroInterval)
    pomodoroRunning.value = false
  } else {
    pomodoroRunning.value = true
    pomodoroInterval = setInterval(() => {
      if (pomodoroSeconds.value > 0) {
        pomodoroSeconds.value--
      } else {
        if (pomodoroInterval) clearInterval(pomodoroInterval)
        pomodoroRunning.value = false
        if (pomodoroPhase.value === 'work') {
          pomodoroSessions.value++
          pomodoroPhase.value = 'break'
          pomodoroSeconds.value = 5 * 60
        } else {
          pomodoroPhase.value = 'work'
          pomodoroSeconds.value = 25 * 60
        }
      }
    }, 1000)
  }
}

function resetPomodoro() {
  if (pomodoroInterval) clearInterval(pomodoroInterval)
  pomodoroRunning.value = false
  pomodoroPhase.value = 'work'
  pomodoroSeconds.value = 25 * 60
}

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

// Load task stats
watch(() => store.workspace?.id, async (wsId) => {
  if (!wsId || store.projects.length === 0) return

  // Load token stats
  loadTokenUsage()

  try {
    const supabase = useSupabaseClient()
    const projectIds = store.projects.map(p => p.id)

    const { count: total } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
    taskCount.value = total || 0

    // Get completed tasks (last column of each project)
    const { data: cols } = await supabase
      .from('kanban_columns')
      .select('id, project_id, position')
      .in('project_id', projectIds)
      .order('position', { ascending: false })

    if (cols && cols.length > 0) {
      const lastCols = new Map<string, string>()
      for (const col of cols as any[]) {
        if (!lastCols.has(col.project_id)) lastCols.set(col.project_id, col.id)
      }
      const lastColIds = Array.from(lastCols.values())

      const { count: done } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('column_id', lastColIds)
      completedTasks.value = done || 0
    }

    // Calculate focus score
    if (taskCount.value > 0) {
      const ratio = completedTasks.value / taskCount.value
      focusScore.value = Math.round(ratio * 100)
    }
  } catch { /* silent */ }
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

onUnmounted(() => {
  if (pomodoroInterval) clearInterval(pomodoroInterval)
})
</script>
