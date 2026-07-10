export type PomodoroMode = 'classic' | 'deep'

// classic = Pomodoro tradicional 25/5 · deep = Deep Work 50/10 (estilo sesiones hyperfocus)
const MODE_DURATIONS: Record<PomodoroMode, { work: number; break: number }> = {
  classic: { work: 25 * 60, break: 5 * 60 },
  deep: { work: 50 * 60, break: 10 * 60 },
}

const pomodoroMode = ref<PomodoroMode>('classic')
const pomodoroSeconds = ref(MODE_DURATIONS.classic.work)
const pomodoroRunning = ref(false)
const pomodoroPhase = ref<'work' | 'break'>('work')
const pomodoroSessions = ref(0)
const activeTask = ref<{ id: string; title: string } | null>(null)
const hyperfocusOpen = ref(false)
let pomodoroInterval: ReturnType<typeof setInterval> | null = null
let _workspaceId: string | null = null
let _pushNotif: ReturnType<typeof usePushNotifications> | null = null

const CIRCUMFERENCE = 213.63

const workDuration = computed(() => MODE_DURATIONS[pomodoroMode.value].work)
const breakDuration = computed(() => MODE_DURATIONS[pomodoroMode.value].break)

const pomodoroTotal = computed(() => pomodoroPhase.value === 'work' ? workDuration.value : breakDuration.value)

const pomodoroRingOffset = computed(() => {
  const progress = pomodoroSeconds.value / pomodoroTotal.value
  return CIRCUMFERENCE * (1 - progress)
})

const pomodoroDisplay = computed(() => {
  const m = Math.floor(pomodoroSeconds.value / 60)
  const s = pomodoroSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

function _clearInterval() {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval)
    pomodoroInterval = null
  }
}

async function _registerSession() {
  if (!activeTask.value || !_workspaceId) return
  try {
    await $fetch(`/api/workspaces/${_workspaceId}/tasks/${activeTask.value.id}/pomodoro`, {
      method: 'POST',
      body: { duration_minutes: Math.round(workDuration.value / 60) },
    })
  } catch (e) {
    console.error('[pomodoro] Failed to register session:', e)
  }
}

function togglePomodoro() {
  if (pomodoroRunning.value) {
    _clearInterval()
    pomodoroRunning.value = false
  } else {
    _pushNotif?.requestPermission()
    pomodoroRunning.value = true
    pomodoroInterval = setInterval(() => {
      if (pomodoroSeconds.value > 0) {
        pomodoroSeconds.value--
      } else {
        _clearInterval()
        pomodoroRunning.value = false
        if (pomodoroPhase.value === 'work') {
          pomodoroSessions.value++
          const taskLabel = activeTask.value ? ` ("${activeTask.value.title}")` : ''
          const breakMin = Math.round(breakDuration.value / 60)
          _pushNotif?.sendLocal('Pomodoro completado!', { body: `Toma un descanso de ${breakMin} minutos.${taskLabel}` })
          _pushNotif?.playSound()
          // Register session for linked task (fire-and-forget)
          if (activeTask.value) _registerSession()
          pomodoroPhase.value = 'break'
          pomodoroSeconds.value = breakDuration.value
        } else {
          _pushNotif?.sendLocal('Descanso terminado!', { body: 'Hora de enfocarse de nuevo.' })
          _pushNotif?.playSound()
          pomodoroPhase.value = 'work'
          pomodoroSeconds.value = workDuration.value
        }
      }
    }, 1000)
  }
}

function resetPomodoro() {
  _clearInterval()
  pomodoroRunning.value = false
  pomodoroPhase.value = 'work'
  pomodoroSeconds.value = workDuration.value
  activeTask.value = null
}

function setMode(mode: PomodoroMode) {
  if (pomodoroMode.value === mode) return
  pomodoroMode.value = mode
  // Only reset the clock when idle — never interrupt a running session
  if (!pomodoroRunning.value) {
    pomodoroPhase.value = 'work'
    pomodoroSeconds.value = workDuration.value
  }
}

function startForTask(task: { id: string; title: string }, workspaceId: string) {
  // If already running for a different task, confirm first
  if (activeTask.value && activeTask.value.id !== task.id && pomodoroRunning.value) {
    if (!confirm(`Pomodoro activo en "${activeTask.value.title}". ¿Cambiar a "${task.title}"?`)) return
  }
  _clearInterval()
  _workspaceId = workspaceId
  activeTask.value = { id: task.id, title: task.title }
  pomodoroPhase.value = 'work'
  pomodoroSeconds.value = workDuration.value
  pomodoroRunning.value = false
  // Auto-start
  togglePomodoro()
}

/**
 * Enter Hyperfocus Mode: fullscreen overlay + Deep Work 50/10 cycle.
 * Works with or without a linked task — sessions only get registered when a task is set.
 */
function startHyperfocus(task?: { id: string; title: string } | null, workspaceId?: string) {
  setMode('deep')
  if (task && workspaceId) {
    startForTask(task, workspaceId)
  } else if (!pomodoroRunning.value) {
    pomodoroPhase.value = 'work'
    pomodoroSeconds.value = workDuration.value
    togglePomodoro()
  }
  hyperfocusOpen.value = true
}

export function usePomodoroTimer() {
  // Lazy-init push notifications (must be called within component context)
  if (!_pushNotif) {
    try { _pushNotif = usePushNotifications() } catch {}
  }

  return {
    seconds: pomodoroSeconds,
    running: pomodoroRunning,
    phase: pomodoroPhase,
    sessions: pomodoroSessions,
    activeTask,
    mode: pomodoroMode,
    hyperfocusOpen,
    display: pomodoroDisplay,
    ringOffset: pomodoroRingOffset,
    total: pomodoroTotal,
    togglePomodoro,
    resetPomodoro,
    setMode,
    startForTask,
    startHyperfocus,
  }
}
