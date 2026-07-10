<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-fade-up">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
          <UIcon name="i-heroicons-sun" class="w-6 h-6 text-amber-500" />
          {{ t.myDay }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ todayLabel }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Task buckets -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
        </div>

        <template v-else>
          <!-- Empty state -->
          <div v-if="isEmpty" class="text-center py-16 bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 animate-fade-up">
            <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-check-badge" class="w-8 h-8 text-emerald-500" />
            </div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ t.noTasksToday }}</p>
          </div>

          <!-- Buckets -->
          <section v-for="bucket in buckets" :key="bucket.key" v-show="bucket.tasks.length > 0" class="animate-fade-up">
            <div class="flex items-center gap-2 mb-3">
              <UIcon :name="bucket.icon" class="w-4 h-4" :class="bucket.iconClass" />
              <h2 class="text-[11px] font-bold uppercase tracking-widest" :class="bucket.titleClass">{{ bucket.label }}</h2>
              <span class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">{{ bucket.tasks.length }}</span>
            </div>
            <div class="space-y-2">
              <button
                v-for="task in bucket.tasks"
                :key="task.id"
                class="w-full text-left bg-white dark:bg-[#1b1b1b] rounded-xl px-4 py-3 border border-gray-200/80 dark:border-white/10 hover:border-focusflow-300 dark:hover:border-[#75fc96]/30 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
                @click="openTask(task)"
              >
                <div class="flex items-center gap-3">
                  <span class="w-1.5 h-8 rounded-full shrink-0" :style="{ backgroundColor: task.project_color }" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ lang.localizedTitle(task) }}</p>
                    <p class="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      {{ task.project_name }}
                      <span v-if="task.due_date"> · {{ formatDue(task.due_date) }}</span>
                      <span v-if="task.estimated_hours"> · {{ task.estimated_hours }}h</span>
                    </p>
                  </div>
                  <span
                    class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                    :class="priorityClasses(task.priority)"
                  >{{ task.priority }}</span>
                  <button
                    class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shrink-0"
                    :title="lang.language.value === 'en' ? 'Hyperfocus Mode (50/10 + music)' : 'Modo Hiperenfoque (50/10 + música)'"
                    @click.stop="startHyperfocus(task)"
                  >
                    <UIcon name="i-heroicons-bolt-solid" class="w-4 h-4" />
                  </button>
                  <button
                    class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shrink-0"
                    :title="lang.language.value === 'en' ? 'Start Pomodoro' : 'Iniciar Pomodoro'"
                    @click.stop="startPomodoro(task)"
                  >
                    <UIcon name="i-heroicons-play" class="w-4 h-4" />
                  </button>
                </div>
              </button>
            </div>
          </section>
        </template>
      </div>

      <!-- Pomodoro side card -->
      <div class="space-y-4">
        <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-6 border border-gray-200/80 dark:border-white/10 shadow-card text-center animate-fade-up">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Pomodoro</p>
          <p class="text-5xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{{ pomodoro.display.value }}</p>
          <p v-if="pomodoro.activeTask.value" class="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
            {{ pomodoro.activeTask.value.title }}
          </p>
          <p v-else class="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {{ lang.language.value === 'en' ? 'Pick a task and press play' : 'Elige una tarea y presiona play' }}
          </p>
          <div class="flex items-center justify-center gap-2 mt-5">
            <UButton
              :icon="pomodoro.running.value ? 'i-heroicons-pause' : 'i-heroicons-play'"
              color="primary"
              size="lg"
              class="font-semibold"
              :disabled="!pomodoro.activeTask.value"
              @click="pomodoro.togglePomodoro()"
            />
            <UButton
              icon="i-heroicons-arrow-path"
              variant="soft"
              color="neutral"
              size="lg"
              :disabled="!pomodoro.activeTask.value"
              @click="pomodoro.resetPomodoro()"
            />
          </div>
          <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-4 tabular-nums">
            {{ pomodoro.sessions.value }} {{ lang.language.value === 'en' ? 'sessions today' : 'sesiones hoy' }}
          </p>
          <button
            class="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold py-2.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            @click="pomodoro.startHyperfocus(null)"
          >
            <UIcon name="i-heroicons-bolt-solid" class="w-4 h-4" />
            {{ lang.language.value === 'en' ? 'Enter Hyperfocus' : 'Entrar en Hiperenfoque' }}
          </button>
          <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
            {{ lang.language.value === 'en' ? 'Fullscreen · 50/10 deep work · focus music' : 'Pantalla completa · deep work 50/10 · música de enfoque' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useWorkspaceStore()
const lang = useLanguage()
const { labels: t } = lang
const router = useRouter()
const pomodoro = usePomodoroTimer()

interface MyDayTask {
  id: string
  title: string
  title_en?: string
  priority: string
  due_date?: string
  estimated_hours?: number
  project_id: string
  project_name: string
  project_color: string
}

const loading = ref(true)
const overdue = ref<MyDayTask[]>([])
const today = ref<MyDayTask[]>([])
const upcoming = ref<MyDayTask[]>([])

const isEmpty = computed(() => !overdue.value.length && !today.value.length && !upcoming.value.length)

const buckets = computed(() => [
  {
    key: 'overdue', tasks: overdue.value, label: t.value.overdueTasks,
    icon: 'i-heroicons-exclamation-triangle', iconClass: 'text-red-500', titleClass: 'text-red-500',
  },
  {
    key: 'today', tasks: today.value, label: t.value.dueToday,
    icon: 'i-heroicons-sun', iconClass: 'text-amber-500', titleClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'upcoming', tasks: upcoming.value, label: t.value.upcomingTasks,
    icon: 'i-heroicons-calendar', iconClass: 'text-sky-500', titleClass: 'text-sky-600 dark:text-sky-400',
  },
])

const todayLabel = computed(() =>
  new Date().toLocaleDateString(lang.language.value === 'en' ? 'en-US' : 'es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
)

function formatDue(due: string) {
  return new Date(due).toLocaleDateString(lang.language.value === 'en' ? 'en-US' : 'es-ES', {
    day: 'numeric', month: 'short',
  })
}

function priorityClasses(p: string) {
  return ({
    critical: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    high: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    medium: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    low: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  } as Record<string, string>)[p] || 'bg-gray-100 text-gray-500'
}

function openTask(task: MyDayTask) {
  router.push(`/${store.slug}/projects/${task.project_id}/kanban`)
}

function startPomodoro(task: MyDayTask) {
  if (!store.workspace?.id) return
  pomodoro.startForTask({ id: task.id, title: lang.localizedTitle(task) }, store.workspace.id)
}

function startHyperfocus(task: MyDayTask) {
  if (!store.workspace?.id) return
  pomodoro.startHyperfocus({ id: task.id, title: lang.localizedTitle(task) }, store.workspace.id)
}

async function load() {
  if (!store.workspace?.id) return
  loading.value = true
  try {
    const data = await $fetch<{ overdue: MyDayTask[]; today: MyDayTask[]; upcoming: MyDayTask[] }>(
      `/api/workspaces/${store.workspace.id}/my-day`
    )
    overdue.value = data.overdue
    today.value = data.today
    upcoming.value = data.upcoming
  } catch { /* silent */ } finally {
    loading.value = false
  }
}

watch(() => store.workspace?.id, () => { load() }, { immediate: true })
</script>
