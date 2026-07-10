<template>
  <Teleport to="body">
    <Transition name="hyperfocus-fade">
      <div
        v-if="pomodoro.hyperfocusOpen.value"
        class="fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-hidden bg-[#08080d] text-white select-none"
      >
        <!-- Ambient glow that breathes with the phase -->
        <div
          class="pointer-events-none absolute inset-0 transition-all duration-[3000ms]"
          :class="pomodoro.phase.value === 'work' ? 'opacity-40' : 'opacity-25'"
          :style="{ background: `radial-gradient(ellipse 80% 50% at 50% 40%, ${glowColor}22 0%, transparent 70%)` }"
        />

        <!-- Top bar -->
        <div class="relative w-full flex items-center justify-between px-5 sm:px-8 pt-5">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-bolt-solid" class="w-4 h-4 text-amber-400" />
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{{ en ? 'Hyperfocus Mode' : 'Modo Hiperenfoque' }}</span>
          </div>
          <div class="flex items-center gap-2">
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
        <div class="relative flex flex-col items-center gap-5 px-6">
          <span
            class="text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full transition-colors"
            :class="pomodoro.phase.value === 'work' ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'"
          >
            {{ pomodoro.phase.value === 'work' ? (en ? 'Focus' : 'Enfoque') : (en ? 'Break' : 'Descanso') }}
          </span>

          <div class="relative w-64 h-64 sm:w-72 sm:h-72">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6" />
              <circle
                cx="130" cy="130" r="120" fill="none"
                :stroke="glowColor" stroke-width="6" stroke-linecap="round"
                :stroke-dasharray="RING_C"
                :stroke-dashoffset="ringOffset"
                class="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight">{{ pomodoro.display.value }}</p>
              <p class="text-[11px] text-white/40 mt-2 tabular-nums">
                {{ pomodoro.sessions.value }} {{ en ? 'sessions' : 'sesiones' }}
              </p>
            </div>
          </div>

          <p v-if="pomodoro.activeTask.value" class="max-w-md text-center text-sm font-medium text-white/80 truncate px-4">
            {{ pomodoro.activeTask.value.title }}
          </p>
          <p v-else class="text-xs text-white/35 italic">{{ en ? 'Free focus session' : 'Sesión de enfoque libre' }}</p>

          <!-- Controls -->
          <div class="flex items-center gap-3">
            <button
              class="w-14 h-14 rounded-full bg-white text-[#08080d] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-white/10"
              @click="pomodoro.togglePomodoro()"
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

        <!-- Bottom: music + quote -->
        <div class="relative w-full px-5 sm:px-8 pb-6 space-y-4">
          <p class="text-center text-xs text-white/35 italic">"{{ lofi.currentQuote.value }}"</p>

          <div class="max-w-2xl mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.07] px-4 py-3">
            <div class="flex items-center gap-3 flex-wrap justify-center sm:justify-between">
              <!-- Station chips (hyperfocus first) -->
              <div class="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  v-for="st in focusStations"
                  :key="st.id"
                  class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                  :class="lofi.currentStationId.value === st.id ? 'text-white' : 'bg-transparent text-white/40 hover:text-white/75 hover:bg-white/[0.06]'"
                  :style="lofi.currentStationId.value === st.id ? { backgroundColor: st.color + '33' } : {}"
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

const HYPERFOCUS_IDS = ['hyperfocus-house', 'tunnel-vision', 'pomodoro-50-10', 'brown-noise-focus', 'deep-focus-lofi']
const focusStations = computed(() => lofi.stations.filter(s => HYPERFOCUS_IDS.includes(s.id)))

const glowColor = computed(() => pomodoro.phase.value === 'work' ? '#F59E0B' : '#10B981')

const ringOffset = computed(() => {
  const progress = pomodoro.seconds.value / pomodoro.total.value
  return RING_C * (1 - progress)
})

function minimize() {
  pomodoro.hyperfocusOpen.value = false
}

function endSession() {
  pomodoro.resetPomodoro()
  pomodoro.hyperfocusOpen.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && pomodoro.hyperfocusOpen.value) minimize()
}

// Auto-start hyperfocus music when the overlay opens and nothing is playing
watch(() => pomodoro.hyperfocusOpen.value, (open) => {
  if (!open) return
  if (!lofi.isPlaying.value) {
    const target = HYPERFOCUS_IDS.includes(lofi.currentStationId.value)
      ? lofi.currentStationId.value
      : HYPERFOCUS_IDS[0]!
    lofi.setStation(target)
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
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
</style>
