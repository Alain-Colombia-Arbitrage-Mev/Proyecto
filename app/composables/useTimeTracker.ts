/**
 * Time tracker composable — persistent timer state across page navigation.
 * Uses localStorage to persist running timer state.
 */

interface TimerState {
  running: boolean
  startTime: string | null
  taskId: string | null
  taskTitle: string | null
  projectId: string | null
  workspaceId: string | null
  description: string | null
}

const STORAGE_KEY = 'focusflow_timer'

function loadState(): TimerState {
  if (typeof localStorage === 'undefined') {
    return { running: false, startTime: null, taskId: null, taskTitle: null, projectId: null, workspaceId: null, description: null }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { running: false, startTime: null, taskId: null, taskTitle: null, projectId: null, workspaceId: null, description: null }
}

function saveState(state: TimerState) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

const timerState = ref<TimerState>({ running: false, startTime: null, taskId: null, taskTitle: null, projectId: null, workspaceId: null, description: null })

if (import.meta.client) {
  timerState.value = loadState()
}
const elapsedSeconds = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

function updateElapsed() {
  if (timerState.value.running && timerState.value.startTime) {
    const start = new Date(timerState.value.startTime).getTime()
    elapsedSeconds.value = Math.floor((Date.now() - start) / 1000)
  } else {
    elapsedSeconds.value = 0
  }
}

function startInterval() {
  if (intervalId) return
  updateElapsed()
  intervalId = setInterval(updateElapsed, 1000)
}

function stopInterval() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// Auto-start interval if timer was running (page refresh)
if (timerState.value.running) {
  startInterval()
}

export function useTimeTracker() {
  const isRunning = computed(() => timerState.value.running)
  const activeTaskId = computed(() => timerState.value.taskId)
  const activeTaskTitle = computed(() => timerState.value.taskTitle)
  const activeDescription = computed(() => timerState.value.description)

  const elapsedDisplay = computed(() => {
    const total = elapsedSeconds.value
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const elapsedMinutes = computed(() => Math.floor(elapsedSeconds.value / 60))

  function startTimer(opts: {
    workspaceId: string
    taskId?: string
    taskTitle?: string
    projectId?: string
    description?: string
  }) {
    timerState.value = {
      running: true,
      startTime: new Date().toISOString(),
      taskId: opts.taskId || null,
      taskTitle: opts.taskTitle || null,
      projectId: opts.projectId || null,
      workspaceId: opts.workspaceId,
      description: opts.description || null,
    }
    saveState(timerState.value)
    startInterval()
  }

  async function stopTimer(): Promise<{ durationMinutes: number; entry?: unknown } | null> {
    if (!timerState.value.running || !timerState.value.startTime || !timerState.value.workspaceId) return null

    stopInterval()

    const endTime = new Date().toISOString()
    const start = new Date(timerState.value.startTime).getTime()
    const durationMinutes = Math.max(1, Math.round((Date.now() - start) / 60000))

    try {
      const entry = await $fetch(`/api/workspaces/${timerState.value.workspaceId}/time-entries`, {
        method: 'POST',
        body: {
          task_id: timerState.value.taskId,
          project_id: timerState.value.projectId,
          start_time: timerState.value.startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          description: timerState.value.description,
          source: 'timer',
          billable: true,
        },
      })

      timerState.value = { running: false, startTime: null, taskId: null, taskTitle: null, projectId: null, workspaceId: null, description: null }
      saveState(timerState.value)
      elapsedSeconds.value = 0

      return { durationMinutes, entry }
    } catch (err) {
      console.error('[useTimeTracker] Error saving time entry:', err)
      // Reset timer state even on error
      timerState.value = { running: false, startTime: null, taskId: null, taskTitle: null, projectId: null, workspaceId: null, description: null }
      saveState(timerState.value)
      elapsedSeconds.value = 0
      return { durationMinutes }
    }
  }

  function discardTimer() {
    stopInterval()
    timerState.value = { running: false, startTime: null, taskId: null, taskTitle: null, projectId: null, workspaceId: null, description: null }
    saveState(timerState.value)
    elapsedSeconds.value = 0
  }

  return {
    isRunning,
    activeTaskId,
    activeTaskTitle,
    activeDescription,
    elapsedSeconds,
    elapsedDisplay,
    elapsedMinutes,
    startTimer,
    stopTimer,
    discardTimer,
  }
}
