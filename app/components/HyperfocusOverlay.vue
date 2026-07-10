<template>
  <Teleport to="body">
    <Transition name="hyperfocus-fade">
      <div
        v-if="pomodoro.hyperfocusOpen.value"
        class="fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-hidden bg-[#060609] text-white select-none"
        :class="{ 'hf-idle': isIdle }"
        @mousemove="wakeUI"
        @touchstart="wakeUI"
      >
        <!-- Ambient glow: station color, breathes slowly during break -->
        <div
          class="pointer-events-none absolute inset-0 transition-all duration-[3000ms]"
          :class="pomodoro.phase.value === 'break' ? 'hf-breathe' : ''"
          :style="{ background: `radial-gradient(ellipse 90% 60% at 50% 38%, ${stationColor}26 0%, transparent 70%)`, opacity: pomodoro.phase.value === 'work' ? 0.5 : 0.35 }"
        />
        <div
          class="pointer-events-none absolute inset-0 opacity-30"
          :style="{ background: `radial-gradient(ellipse 40% 30% at 50% 105%, ${glowColor}1f 0%, transparent 70%)` }"
        />

        <!-- Top bar (fades when idle) -->
        <div class="hf-chrome relative w-full flex items-center justify-between px-5 sm:px-8 pt-5">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-bolt-solid" class="w-4 h-4 text-amber-400" />
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{{ en ? 'Hyperfocus Mode' : 'Modo Hiperenfoque' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <!-- Auto-continue cycles -->
            <button
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
              :class="pomodoro.autoContinue.value ? 'bg-amber-400/15 text-amber-300' : 'bg-white/[0.06] text-white/40 hover:text-white/70'"
              :title="en ? 'Chain work/break cycles automatically' : 'Encadenar ciclos trabajo/descanso automáticamente'"
              @click="pomodoro.autoContinue.value = !pomodoro.autoContinue.value"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-3 h-3" />
              {{ en ? 'Auto cycle' : 'Ciclo auto' }}
            </button>
            <!-- Mode switch -->
            <div class="flex items-center rounded-lg bg-white/[0.06] p-0.5">
              <button
                v-for="m in modes"
                :key="m.value"
                class="px-2.5 py-1 rounded-md text-[10px] font-bold tabular-nums transition-colors cursor-pointer"
                :class="pomodoro.mode.value === m.value ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'"
                @click="pomodoro.setMode(m.value)"
              >{{ m.label }}</button>
            </div>
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              :title="en ? 'Minimize (timer keeps running)' : 'Minimizar (el timer sigue corriendo)'"
              @click="minimize"
            >
              <UIcon name="i-heroicons-arrows-pointing-in" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Center: timer ring -->
        <div class="relative flex flex-col items-center gap-4 px-6">
          <span
            class="text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full transition-colors"
            :class="pomodoro.phase.value === 'work' ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'"
          >
            {{ pomodoro.phase.value === 'work' ? (en ? 'Focus' : 'Enfoque') : (en ? 'Break — breathe' : 'Descanso — respira') }}
          </span>

          <div class="relative w-64 h-64 sm:w-72 sm:h-72" :class="pomodoro.phase.value === 'break' ? 'hf-breathe' : ''">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6" />
              <circle
                cx="130" cy="130" r="120" fill="none"
                :stroke="glowColor" stroke-width="6" stroke-linecap="round"
                :stroke-dasharray="RING_C"
                :stroke-dashoffset="ringOffset"
                class="transition-[stroke-dashoffset] duration-1000 ease-linear"
                :style="{ filter: `drop-shadow(0 0 12px ${glowColor}66)` }"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight">{{ pomodoro.display.value }}</p>
              <!-- Session dots: one per completed pomodoro (cycles of 4) -->
              <div class="flex items-center gap-1.5 mt-3">
                <span
                  v-for="i in 4"
                  :key="i"
                  class="w-1.5 h-1.5 rounded-full transition-colors"
                  :class="i <= (pomodoro.sessions.value % 4 === 0 && pomodoro.sessions.value > 0 ? 4 : pomodoro.sessions.value % 4) ? 'bg-amber-400' : 'bg-white/15'"
                />
                <span v-if="pomodoro.sessions.value > 4" class="text-[10px] text-amber-400/80 font-bold tabular-nums ml-1">×{{ pomodoro.sessions.value }}</span>
              </div>
              <p class="text-[10px] text-white/35 mt-2">{{ nextPhaseHint }}</p>
            </div>
          </div>

          <p v-if="pomodoro.activeTask.value" class="max-w-md text-center text-sm font-medium text-white/80 truncate px-4">
            {{ pomodoro.activeTask.value.title }}
          </p>
          <p v-else class="text-xs text-white/35 italic">{{ en ? 'Free focus session' : 'Sesión de enfoque libre' }}</p>

          <!-- Controls (fade when idle) -->
          <div class="hf-chrome flex items-center gap-3">
            <button
              class="w-14 h-14 rounded-full bg-white text-[#08080d] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-white/10"
              :title="en ? 'Play/Pause (Space)' : 'Reproducir/Pausar (Espacio)'"
              @click="toggleSession"
            >
              <UIcon :name="pomodoro.running.value ? 'i-heroicons-pause-solid' : 'i-heroicons-play-solid'" class="w-6 h-6" />
            </button>
            <button
              class="w-10 h-10 rounded-full bg-white/[0.08] text-white/60 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
              :title="en ? 'End session' : 'Terminar sesión'"
              @click="endSession"
            >
              <UIcon name="i-heroicons-stop" class="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <!-- Bottom: music + quote (fades when idle) -->
        <div class="hf-chrome relative w-full px-5 sm:px-8 pb-6 space-y-4">
          <p class="text-center text-xs text-white/35 italic">"{{ lofi.currentQuote.value }}"</p>

          <div class="max-w-3xl mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.07] px-4 py-3 backdrop-blur-sm">
            <div class="flex items-center gap-3 flex-wrap justify-center sm:justify-between">
              <!-- Hyperfocus station chips -->
              <div class="flex items-center gap-1.5 flex-wrap justify-center max-w-xl">
                <button
                  v-for="st in focusStations"
                  :key="st.id"
                  class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                  :class="lofi.currentStationId.value === st.id ? 'text-white' : 'bg-transparent text-white/40 hover:text-white/75 hover:bg-white/[0.06]'"
                  :style="lofi.currentStationId.value === st.id ? { backgroundColor: st.color + '33', boxShadow: `inset 0 0 0 1px ${st.color}55` } : {}"
                  @click="lofi.setStation(st.id)"
                >
                  <span>{{ st.emoji }}</span>{{ st.name }}
                </button>
              </div>

              <div class="flex items-center gap-2.5 shrink-0">
                <button
                  class="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                  @click="lofi.toggle()"
                >
                  <UIcon v-if="lofi.isLoading.value" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
                  <UIcon v-else :name="lofi.isPlaying.value ? 'i-heroicons-pause' : 'i-heroicons-play'" class="w-3.5 h-3.5" />
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  :value="lofi.volume.value"
                  class="w-20 accent-white/80 cursor-pointer"
                  @input="lofi.setVolume(parseFloat(($event.target as HTMLInputElement).value))"
                >
              </div>
            </div>
          </div>

          <p class="text-center text-[10px] text-white/25">
            {{ en ? 'Space: play/pause · Esc: minimize' : 'Espacio: reproducir/pausar · Esc: minimizar' }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const pomodoro = usePomodoroTimer()
const lofi = useLofiPlayer()
const lang = useLanguage()

const en = computed(() => lang.language.value === 'en')

const RING_C = 2 * Math.PI * 120 // 753.98

const modes = computed(() => [
  { value: 'classic' as const, label: '25/5' },
  { value: 'deep' as const, label: '50/10' },
])

const focusStations = computed(() => lofi.stations.filter(s => s.focus))

const glowColor = computed(() => pomodoro.phase.value === 'work' ? '#F59E0B' : '#10B981')
const stationColor = computed(() => lofi.currentStation.value?.color || '#F59E0B')

const ringOffset = computed(() => {
  const progress = pomodoro.seconds.value / pomodoro.total.value
  return RING_C * (1 - progress)
})

const nextPhaseHint = computed(() => {
  const deep = pomodoro.mode.value === 'deep'
  if (pomodoro.phase.value === 'work') {
    const mins = deep ? 10 : 5
    return en.value ? `Next: ${mins} min break` : `Siguiente: descanso de ${mins} min`
  }
  const mins = deep ? 50 : 25
  return en.value ? `Next: ${mins} min focus` : `Siguiente: enfoque de ${mins} min`
})

// ── Idle UI: hide chrome + cursor after 4s without movement while running ──
const isIdle = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | null = null

function wakeUI() {
  isIdle.value = false
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (pomodoro.running.value && pomodoro.hyperfocusOpen.value) isIdle.value = true
  }, 4000)
}

// ── Fullscreen ──
async function enterFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
  } catch { /* fullscreen not available — overlay still covers the app */ }
}

function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
}

function minimize() {
  pomodoro.hyperfocusOpen.value = false
  exitFullscreen()
}

// Timer and music pause/resume together inside hyperfocus mode
function toggleSession() {
  const wasRunning = pomodoro.running.value
  pomodoro.togglePomodoro()
  if (wasRunning) {
    if (lofi.isPlaying.value) lofi.pause()
  } else {
    if (!lofi.isPlaying.value) lofi.play()
  }
  wakeUI()
}

function endSession() {
  pomodoro.resetPomodoro()
  if (lofi.isPlaying.value) lofi.pause()
  pomodoro.hyperfocusOpen.value = false
  exitFullscreen()
}

function onKeydown(e: KeyboardEvent) {
  if (!pomodoro.hyperfocusOpen.value) return
  if (e.key === 'Escape') minimize()
  if (e.code === 'Space') {
    const target = e.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
    e.preventDefault()
    toggleSession()
  }
}

// Auto-start hyperfocus music + fullscreen when the overlay opens
watch(() => pomodoro.hyperfocusOpen.value, (open) => {
  if (!open) {
    isIdle.value = false
    if (idleTimer) clearTimeout(idleTimer)
    return
  }
  if (!lofi.isPlaying.value) {
    const focusIds = focusStations.value.map(s => s.id)
    const target = focusIds.includes(lofi.currentStationId.value)
      ? lofi.currentStationId.value
      : (focusIds[0] || lofi.currentStationId.value)
    lofi.setStation(target)
  }
  enterFullscreen()
  wakeUI()
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (idleTimer) clearTimeout(idleTimer)
})
</script>

<style scoped>
.hyperfocus-fade-enter-active,
.hyperfocus-fade-leave-active {
  transition: opacity 0.4s ease;
}
.hyperfocus-fade-enter-from,
.hyperfocus-fade-leave-to {
  opacity: 0;
}

/* Chrome fades away when idle to leave only the timer */
.hf-chrome {
  transition: opacity 0.8s ease;
}
.hf-idle {
  cursor: none;
}
.hf-idle .hf-chrome {
  opacity: 0;
  pointer-events: none;
}

/* Slow breathing during break — 4s in / 4s out like a breathing exercise */
@keyframes hf-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
.hf-breathe {
  animation: hf-breathe 8s ease-in-out infinite;
}
</style>
