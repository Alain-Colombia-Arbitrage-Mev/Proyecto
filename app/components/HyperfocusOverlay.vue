<template>
  <Teleport to="body">
    <Transition name="hyperfocus-fade">
      <div
        v-if="pomodoro.hyperfocusOpen.value"
        class="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-[#050507] text-white select-none"
        :class="{ 'hf-idle': isIdle }"
        @mousemove="wakeUI"
        @touchstart="wakeUI"
      >
        <div
          class="pointer-events-none absolute inset-0 transition-all duration-[3000ms]"
          :class="pomodoro.phase.value === 'break' ? 'hf-breathe' : ''"
          :style="{ background: `radial-gradient(ellipse 95% 58% at 50% 42%, ${stationColor}2e 0%, rgba(5,5,7,0.74) 58%, #050507 100%)` }"
        />
        <div class="pointer-events-none absolute inset-0 hf-grid" />
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
          :style="{ background: `linear-gradient(180deg, ${stationColor}18 0%, transparent 100%)` }"
        />

        <header class="hf-chrome relative w-full px-4 pt-4 sm:px-8 sm:pt-5">
          <div class="flex h-[3.25rem] items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.045] px-3 backdrop-blur-xl sm:px-4">
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/35"
                :style="{ boxShadow: `inset 0 0 0 1px ${stationColor}30` }"
              >
                <UIcon name="i-heroicons-bolt-solid" class="h-[1.125rem] w-[1.125rem] text-amber-300" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                  {{ en ? 'Hyperfocus Mode' : 'Modo Hiperenfoque' }}
                </p>
                <p class="truncate text-xs font-semibold text-white/85">
                  {{ lofi.currentTrack.value.title }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                class="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors cursor-pointer sm:flex"
                :class="pomodoro.autoContinue.value ? 'bg-amber-400/15 text-amber-300' : 'bg-white/[0.06] text-white/45 hover:text-white/75'"
                :title="en ? 'Auto cycle' : 'Ciclo automático'"
                @click="pomodoro.autoContinue.value = !pomodoro.autoContinue.value"
              >
                <UIcon name="i-heroicons-arrow-path" class="h-3.5 w-3.5" />
                {{ en ? 'Auto' : 'Auto' }}
              </button>

              <div class="hidden items-center rounded-lg bg-white/[0.06] p-0.5 sm:flex">
                <button
                  v-for="m in modes"
                  :key="m.value"
                  class="rounded-md px-2.5 py-1.5 text-[10px] font-bold tabular-nums transition-colors cursor-pointer"
                  :class="pomodoro.mode.value === m.value ? 'bg-white/15 text-white' : 'text-white/42 hover:text-white/75'"
                  @click="pomodoro.setMode(m.value)"
                >
                  {{ m.label }}
                </button>
              </div>

              <button
                class="flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                :title="en ? 'Minimize' : 'Minimizar'"
                @click="minimize"
              >
                <UIcon name="i-heroicons-arrows-pointing-in" class="h-[1.125rem] w-[1.125rem]" />
              </button>
            </div>
          </div>
        </header>

        <main class="relative flex min-h-0 flex-1 items-center px-4 py-4 sm:px-8 sm:py-6">
          <div class="mx-auto grid w-full max-w-7xl items-center gap-4 lg:grid-cols-[260px_minmax(300px,1fr)_360px]">
            <section class="hf-chrome hidden rounded-lg border border-white/[0.08] bg-white/[0.045] p-4 backdrop-blur-xl sm:block">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {{ en ? 'Session' : 'Sesión' }}
              </p>
              <div class="mt-4 space-y-4">
                <div>
                  <p class="text-sm font-bold text-white">
                    {{ pomodoro.activeTask.value?.title || (en ? 'Free focus' : 'Enfoque libre') }}
                  </p>
                  <p class="mt-1 text-xs text-white/42">
                    {{ phaseHint }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="rounded-lg bg-black/25 p-3">
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-white/32">
                      {{ en ? 'Mode' : 'Modo' }}
                    </p>
                    <p class="mt-1 text-sm font-bold tabular-nums text-white">{{ pomodoro.mode.value === 'deep' ? '50/10' : '25/5' }}</p>
                  </div>
                  <div class="rounded-lg bg-black/25 p-3">
                    <p class="text-[10px] font-semibold uppercase tracking-wider text-white/32">
                      {{ en ? 'Rounds' : 'Rondas' }}
                    </p>
                    <p class="mt-1 text-sm font-bold tabular-nums text-white">{{ pomodoro.sessions.value }}</p>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-white/32">
                    <span>{{ en ? 'Cycle' : 'Ciclo' }}</span>
                    <span class="tabular-nums">{{ activeSessionDotCount }}/4</span>
                  </div>
                  <div class="grid grid-cols-4 gap-1.5">
                    <span
                      v-for="i in 4"
                      :key="i"
                      class="h-1.5 rounded-full transition-colors"
                      :class="i <= activeSessionDotCount ? 'bg-amber-300' : 'bg-white/12'"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section class="order-first flex flex-col items-center gap-4 lg:order-none">
              <span
                class="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] transition-colors"
                :class="pomodoro.phase.value === 'work' ? 'bg-amber-400/12 text-amber-300' : 'bg-emerald-400/12 text-emerald-300'"
              >
                {{ phaseLabel }}
              </span>

              <div
                class="relative aspect-square w-[72vw] max-w-[20rem] sm:w-80 sm:max-w-none"
                :class="pomodoro.phase.value === 'break' ? 'hf-breathe' : ''"
              >
                <div
                  class="absolute inset-5 rounded-full opacity-45 blur-2xl"
                  :style="{ backgroundColor: glowColor }"
                />
                <svg class="relative h-full w-full -rotate-90" viewBox="0 0 260 260">
                  <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.075)" stroke-width="6" />
                  <circle
                    cx="130"
                    cy="130"
                    r="120"
                    fill="none"
                    :stroke="glowColor"
                    stroke-width="6"
                    stroke-linecap="round"
                    :stroke-dasharray="RING_C"
                    :stroke-dashoffset="ringOffset"
                    class="transition-[stroke-dashoffset] duration-1000 ease-linear"
                    :style="{ filter: `drop-shadow(0 0 16px ${glowColor}66)` }"
                  />
                </svg>

                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <p class="text-6xl font-bold tabular-nums tracking-tight sm:text-7xl">{{ pomodoro.display.value }}</p>
                  <p class="mt-2 text-xs font-semibold text-white/42">{{ nextPhaseHint }}</p>
                  <div class="mt-4 flex items-end gap-[3px] opacity-80" :style="{ color: stationColor }">
                    <span class="hf-eq h-3 w-[3px] rounded-full bg-current" />
                    <span class="hf-eq h-5 w-[3px] rounded-full bg-current" />
                    <span class="hf-eq h-4 w-[3px] rounded-full bg-current" />
                    <span class="hf-eq h-6 w-[3px] rounded-full bg-current" />
                  </div>
                </div>
              </div>

              <div class="hf-chrome flex items-center gap-3">
                <button
                  class="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-white text-[#08080d] shadow-lg shadow-white/10 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  :title="pomodoro.running.value ? (en ? 'Pause' : 'Pausar') : (en ? 'Play' : 'Reproducir')"
                  @click="toggleSession"
                >
                  <UIcon :name="pomodoro.running.value ? 'i-heroicons-pause-solid' : 'i-heroicons-play-solid'" class="h-[1.625rem] w-[1.625rem]" />
                </button>
                <button
                  class="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-white/60 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
                  :title="en ? 'End session' : 'Terminar sesión'"
                  @click="endSession"
                >
                  <UIcon name="i-heroicons-stop" class="h-[1.125rem] w-[1.125rem]" />
                </button>
              </div>
            </section>

            <section class="hf-chrome rounded-lg border border-white/[0.08] bg-white/[0.045] p-4 backdrop-blur-xl">
              <div class="flex items-center justify-between gap-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                  {{ en ? 'Audio' : 'Audio' }}
                </p>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold"
                  :class="musicStatusClass"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current" />
                  {{ musicStatusLabel }}
                </span>
              </div>

              <div class="mt-4 flex items-center gap-3">
                <div
                  class="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/35 text-2xl"
                  :style="{ boxShadow: `0 0 24px ${stationColor}22, inset 0 0 0 1px ${stationColor}33` }"
                >
                  {{ lofi.currentStation.value.emoji }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-white">{{ lofi.currentTrack.value.title }}</p>
                  <p class="mt-0.5 truncate text-xs text-white/42">
                    {{ lofi.currentTrack.value.artist }} · {{ lofi.currentStation.value.name }}
                  </p>
                  <p v-if="lofi.sessionElapsed.value > 0" class="mt-1 text-[10px] font-mono text-white/30 tabular-nums">
                    {{ lofi.sessionTimeFormatted.value }}
                  </p>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-center gap-4">
                <button
                  class="flex h-9 w-9 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer"
                  :title="en ? 'Previous focus station' : 'Estación focus anterior'"
                  @click="skipFocus(-1)"
                >
                  <UIcon name="i-heroicons-backward" class="h-[1.125rem] w-[1.125rem]" />
                </button>
                <button
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/10 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  :disabled="lofi.isLoading.value"
                  :title="lofi.isPlaying.value ? (en ? 'Pause audio' : 'Pausar audio') : (en ? 'Play audio' : 'Reproducir audio')"
                  @click="toggleMusic"
                >
                  <UIcon v-if="lofi.isLoading.value" name="i-heroicons-arrow-path" class="h-[1.375rem] w-[1.375rem] animate-spin" />
                  <UIcon v-else :name="lofi.isPlaying.value ? 'i-heroicons-pause' : 'i-heroicons-play'" class="h-[1.375rem] w-[1.375rem]" />
                </button>
                <button
                  class="flex h-9 w-9 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer"
                  :title="en ? 'Next focus station' : 'Siguiente estación focus'"
                  @click="skipFocus(1)"
                >
                  <UIcon name="i-heroicons-forward" class="h-[1.125rem] w-[1.125rem]" />
                </button>
              </div>

              <div class="mt-4 flex items-center gap-2.5">
                <UIcon name="i-heroicons-speaker-x-mark" class="h-3.5 w-3.5 text-white/25" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  :value="lofi.volume.value"
                  class="w-full accent-white/80 cursor-pointer"
                  @input="lofi.setVolume(Number(($event.target as HTMLInputElement).value))"
                >
                <UIcon name="i-heroicons-speaker-wave" class="h-3.5 w-3.5 text-white/25" />
              </div>

              <div class="mt-4 overflow-hidden rounded-lg border border-white/[0.07] bg-black/20">
                <div class="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2">
                  <div class="flex min-w-0 items-center gap-2">
                    <UIcon name="i-heroicons-musical-note" class="h-3.5 w-3.5 shrink-0 text-white/42" />
                    <p class="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {{ en ? 'Track List' : 'Lista de canciones' }}
                    </p>
                  </div>
                  <span class="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-white/36">
                    {{ hyperfocusPlaylist.length }} {{ en ? 'tracks' : 'canciones' }}
                  </span>
                </div>

                <div class="hf-focus-stations max-h-[16rem] space-y-1 overflow-y-auto p-1.5">
                  <button
                    v-for="st in hyperfocusPlaylist"
                    :key="st.id"
                    class="group flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer"
                    :class="lofi.currentStationId.value === st.id ? 'text-white' : 'text-white/50 hover:bg-white/[0.055] hover:text-white/82'"
                    :style="lofi.currentStationId.value === st.id ? { backgroundColor: st.color + '20', boxShadow: `inset 0 0 0 1px ${st.color}55` } : {}"
                    :aria-current="lofi.currentStationId.value === st.id ? 'true' : 'false'"
                    @click="selectPlaylistItem(st.id)"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.045] text-lg"
                      :style="{ boxShadow: lofi.currentStationId.value === st.id ? `0 0 18px ${st.color}2f` : 'none' }"
                    >
                      {{ st.emoji }}
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-xs font-bold leading-tight text-white/90">
                        {{ st.tracks[0]?.title || st.name }}
                      </span>
                      <span class="mt-0.5 block truncate text-[10px] font-medium text-white/34">
                        {{ st.tracks[0]?.artist || st.name }} · {{ st.name }}
                      </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2">
                      <span
                        class="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        :class="lofi.currentStationId.value === st.id ? 'bg-emerald-400/12 text-emerald-300' : 'bg-white/[0.055] text-white/30'"
                      >
                        {{ st.tracks[0]?.duration || 'LIVE' }}
                      </span>
                      <span v-if="lofi.isPlaying.value && lofi.currentStationId.value === st.id" class="flex h-4 items-end gap-[2px] text-white">
                        <span class="hf-mini-eq h-2 w-[2px] rounded-full bg-current" />
                        <span class="hf-mini-eq h-3.5 w-[2px] rounded-full bg-current" />
                        <span class="hf-mini-eq h-2.5 w-[2px] rounded-full bg-current" />
                      </span>
                      <UIcon v-else name="i-heroicons-play" class="h-3.5 w-3.5 text-white/28 transition-colors group-hover:text-white/70" />
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer class="hf-chrome relative w-full px-4 pb-5 sm:px-8 sm:pb-6">
          <p class="mx-auto max-w-3xl text-center text-xs italic leading-relaxed text-white/35">
            "{{ lofi.currentQuote.value }}"
          </p>
        </footer>
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

const hyperfocusPlaylist = computed(() => {
  const list = [...lofi.focusStations.value]
  const activeStation = lofi.currentStation.value
  if (activeStation && !list.some(station => station.id === activeStation.id)) {
    return [activeStation, ...list]
  }
  return list
})

const glowColor = computed(() => pomodoro.phase.value === 'work' ? '#F59E0B' : '#10B981')
const stationColor = computed(() => lofi.currentStation.value?.color || '#F59E0B')

const activeSessionDotCount = computed(() => {
  const sessions = pomodoro.sessions.value
  if (sessions > 0 && sessions % 4 === 0) return 4
  return sessions % 4
})

const ringOffset = computed(() => {
  const progress = pomodoro.seconds.value / pomodoro.total.value
  return RING_C * (1 - progress)
})

const phaseLabel = computed(() => {
  if (pomodoro.phase.value === 'work') return en.value ? 'Focus' : 'Enfoque'
  return en.value ? 'Break' : 'Descanso'
})

const phaseHint = computed(() => {
  if (pomodoro.phase.value === 'work') {
    return en.value ? 'Protect attention until the next break.' : 'Protege la atención hasta el próximo descanso.'
  }
  return en.value ? 'Reset energy before the next sprint.' : 'Recupera energía antes del siguiente sprint.'
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

const musicStatusLabel = computed(() => {
  if (lofi.isLoading.value) return en.value ? 'Syncing' : 'Sincronizando'
  if (lofi.isPlaying.value) return en.value ? 'Synced' : 'Sincronizado'
  return en.value ? 'Paused' : 'Pausado'
})

const musicStatusClass = computed(() => {
  if (lofi.isLoading.value) return 'bg-amber-400/12 text-amber-300'
  if (lofi.isPlaying.value) return 'bg-emerald-400/12 text-emerald-300'
  return 'bg-white/[0.06] text-white/42'
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
  } catch { /* fullscreen not available; overlay still covers the app */ }
}

function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
}

function minimize() {
  pomodoro.hyperfocusOpen.value = false
  exitFullscreen()
}

function toggleMusic() {
  if (lofi.isPlaying.value) lofi.pause()
  else lofi.syncHyperfocusAudio().catch(() => {})
  wakeUI()
}

function skipFocus(direction: -1 | 1) {
  lofi.skipFocus(direction)
  wakeUI()
}

function selectPlaylistItem(stationId: string) {
  if (lofi.currentStationId.value === stationId) {
    if (!lofi.isPlaying.value && !lofi.isLoading.value) lofi.play()
  } else {
    lofi.setStation(stationId)
  }
  wakeUI()
}

// Timer and music pause/resume together inside hyperfocus mode.
function toggleSession() {
  const wasRunning = pomodoro.running.value
  pomodoro.togglePomodoro()
  if (wasRunning) {
    if (lofi.isPlaying.value) lofi.pause()
  } else if (!lofi.isPlaying.value) {
    lofi.syncHyperfocusAudio().catch(() => {})
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

watch(() => pomodoro.hyperfocusOpen.value, (open) => {
  if (!open) {
    isIdle.value = false
    if (idleTimer) clearTimeout(idleTimer)
    return
  }
  lofi.syncHyperfocusAudio().catch(() => {})
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

.hf-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.032) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.032) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 78% 64% at 50% 48%, black 0%, transparent 76%);
  opacity: 0.4;
}

/* Chrome fades away when idle to leave only the timer. */
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

.hf-focus-stations {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
}
.hf-focus-stations::-webkit-scrollbar {
  width: 4px;
}
.hf-focus-stations::-webkit-scrollbar-track {
  background: transparent;
}
.hf-focus-stations::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
}

@keyframes hf-mini-eq {
  0%, 100% { transform: scaleY(0.55); opacity: 0.6; }
  50% { transform: scaleY(1); opacity: 1; }
}
.hf-mini-eq {
  transform-origin: bottom;
  animation: hf-mini-eq 0.8s ease-in-out infinite;
}
.hf-mini-eq:nth-child(2) { animation-delay: 0.12s; }
.hf-mini-eq:nth-child(3) { animation-delay: 0.24s; }

@keyframes hf-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.035); }
}
.hf-breathe {
  animation: hf-breathe 8s ease-in-out infinite;
}

@keyframes hf-eq {
  0%, 100% { transform: scaleY(0.55); opacity: 0.55; }
  50% { transform: scaleY(1); opacity: 1; }
}
.hf-eq {
  transform-origin: bottom;
  animation: hf-eq 0.95s ease-in-out infinite;
}
.hf-eq:nth-child(2) { animation-delay: 0.12s; }
.hf-eq:nth-child(3) { animation-delay: 0.24s; }
.hf-eq:nth-child(4) { animation-delay: 0.36s; }
</style>
