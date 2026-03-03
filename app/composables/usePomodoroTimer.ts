const pomodoroSeconds = ref(25 * 60)
const pomodoroRunning = ref(false)
const pomodoroPhase = ref<'work' | 'break'>('work')
const pomodoroSessions = ref(0)
const activeTask = ref<{ id: string; title: string } | null>(null)
let pomodoroInterval: ReturnType<typeof setInterval> | null = null
let _workspaceId: string | null = null
let _pushNotif: ReturnType<typeof usePushNotifications> | null = null

const WORK_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60
const CIRCUMFERENCE = 213.63

const pomodoroTotal = computed(() => pomodoroPhase.value === 'work' ? WORK_DURATION : BREAK_DURATION)

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
      body: { duration_minutes: 25 },
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
          _pushNotif?.sendLocal('Pomodoro completado!', { body: `Toma un descanso de 5 minutos.${taskLabel}` })
          _pushNotif?.playSound()
          // Register session for linked task (fire-and-forget)
          if (activeTask.value) _registerSession()
          pomodoroPhase.value = 'break'
          pomodoroSeconds.value = BREAK_DURATION
        } else {
          _pushNotif?.sendLocal('Descanso terminado!', { body: 'Hora de enfocarse de nuevo.' })
          _pushNotif?.playSound()
          pomodoroPhase.value = 'work'
          pomodoroSeconds.value = WORK_DURATION
        }
      }
    }, 1000)
  }
}

function resetPomodoro() {
  _clearInterval()
  pomodoroRunning.value = false
  pomodoroPhase.value = 'work'
  pomodoroSeconds.value = WORK_DURATION
  activeTask.value = null
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
  pomodoroSeconds.value = WORK_DURATION
  pomodoroRunning.value = false
  // Auto-start
  togglePomodoro()
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
    display: pomodoroDisplay,
    ringOffset: pomodoroRingOffset,
    total: pomodoroTotal,
    togglePomodoro,
    resetPomodoro,
    startForTask,
  }
}
