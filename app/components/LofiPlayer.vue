<template>
  <!-- SIDEBAR MODE (desktop) — inline in sidebar -->
  <template v-if="sidebar">
    <div class="border-t border-white/[0.06] px-2 py-2">
      <!-- Collapsed sidebar: just icon -->
      <div v-if="sidebarCollapsed" class="flex flex-col items-center gap-1">
        <button
          class="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-black border border-white/[0.08]"
          :class="isPlaying ? 'text-white' : 'text-white/50 hover:text-white'"
          @click="isPlaying ? toggle() : expand()"
          :title="isPlaying ? 'Pause' : 'Play music'"
        >
          <div v-if="isPlaying" class="flex items-end gap-[2px] h-3">
            <span class="w-[2px] bg-white rounded-full animate-bar-1" />
            <span class="w-[2px] bg-white rounded-full animate-bar-2" />
            <span class="w-[2px] bg-white rounded-full animate-bar-3" />
          </div>
          <UIcon v-else name="i-heroicons-musical-note" class="w-4 h-4" />
        </button>
      </div>

      <!-- Expanded sidebar: mini player row -->
      <div v-else>
        <div
          class="flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all bg-black border border-white/[0.08]"
        >
          <!-- Station emoji / bars -->
          <button class="shrink-0 cursor-pointer" @click="expand()">
            <div v-if="isPlaying" class="flex items-end gap-[2px] h-3.5 w-4">
              <span class="w-[2px] bg-white rounded-full animate-bar-1" />
              <span class="w-[2px] bg-white rounded-full animate-bar-2" />
              <span class="w-[2px] bg-white rounded-full animate-bar-3" />
            </div>
            <span v-else class="text-sm">{{ currentStation.emoji }}</span>
          </button>

          <!-- Info -->
          <button class="flex-1 min-w-0 text-left cursor-pointer" @click="expand()">
            <p class="text-[11px] font-semibold truncate leading-tight" :class="isPlaying ? 'text-white' : 'text-white/60'">
              {{ isPlaying ? currentTrack.title : currentStation.name }}
            </p>
            <p v-if="isPlaying && sessionElapsed > 0" class="text-[9px] font-mono text-white/25 tabular-nums mt-0.5">{{ sessionTimeFormatted }}</p>
          </button>

          <!-- Play/Pause -->
          <button
            class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer"
            :class="isPlaying ? 'bg-white text-black hover:bg-white/90' : 'bg-white/15 text-white hover:bg-white/25'"
            @click="toggle()"
          >
            <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            <UIcon v-else-if="isPlaying" name="i-heroicons-pause" class="w-3.5 h-3.5" />
            <UIcon v-else name="i-heroicons-play" class="w-3.5 h-3.5 ml-0.5" />
          </button>

          <!-- Skip next -->
          <button
            v-if="isPlaying"
            class="w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
            @click="skipNext()"
          >
            <UIcon name="i-heroicons-forward" class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </template>

  <!-- FLOATING MODE (mobile) — original fixed position pill -->
  <template v-else>
    <!-- Mini Player Bar (collapsed) -->
    <div
      v-if="!isExpanded"
      class="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 h-11 rounded-full text-white shadow-lg shadow-black/40 bg-black/85 backdrop-blur-xl border border-white/10 transition-all duration-300"
      :class="isPlaying ? 'px-1.5 pl-3' : 'px-3'"
    >
      <!-- Station info — click to expand -->
      <button class="flex items-center gap-2 cursor-pointer shrink-0 min-w-0" @click="expand()">
        <span v-if="!isPlaying" class="text-base">{{ currentStation.emoji }}</span>
        <div v-else class="flex items-end gap-[2px] h-3.5 shrink-0">
          <span class="w-[2px] bg-white rounded-full animate-bar-1" />
          <span class="w-[2px] bg-white rounded-full animate-bar-2" />
          <span class="w-[2px] bg-white rounded-full animate-bar-3" />
        </div>
        <span class="text-[11px] font-semibold truncate max-w-[90px]">{{ isPlaying ? currentTrack.title : currentStation.name }}</span>
      </button>

      <!-- Inline controls when playing -->
      <template v-if="isPlaying">
        <span v-if="sessionElapsed > 0" class="text-[9px] font-mono text-white/40 tabular-nums shrink-0 ml-1">{{ sessionTimeFormatted }}</span>
        <div class="w-px h-5 bg-white/10 ml-1.5 shrink-0" />
        <div class="flex items-center gap-0.5 ml-0.5 shrink-0">
          <button class="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors cursor-pointer" @click="skipPrev()">
            <UIcon name="i-heroicons-backward" class="w-3.5 h-3.5" />
          </button>
          <button class="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black transition-all hover:scale-105 cursor-pointer" @click="toggle()">
            <UIcon name="i-heroicons-pause" class="w-4 h-4" />
          </button>
          <button class="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors cursor-pointer" @click="skipNext()">
            <UIcon name="i-heroicons-forward" class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="w-px h-5 bg-white/10 ml-0.5 shrink-0" />
        <button class="w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white transition-colors cursor-pointer shrink-0" @click="expand()">
          <UIcon name="i-heroicons-chevron-up" class="w-3.5 h-3.5" />
        </button>
      </template>

      <!-- Play + Expand when paused -->
      <template v-else>
        <button class="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black transition-all hover:scale-105 cursor-pointer ml-1" @click="toggle()">
          <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
          <UIcon v-else name="i-heroicons-play" class="w-4 h-4 ml-0.5" />
        </button>
        <button class="w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white transition-colors cursor-pointer shrink-0" @click="expand()">
          <UIcon name="i-heroicons-chevron-up" class="w-3.5 h-3.5" />
        </button>
      </template>
    </div>
  </template>

  <!-- Expanded Player — only render in the matching context to avoid duplicates -->
  <transition name="player-slide">
    <div
      v-if="isExpanded && ((sidebar && showExpandedDesktop) || (!sidebar && showExpandedMobile))"
      class="fixed z-50 rounded-[22px] shadow-2xl shadow-black/50 overflow-hidden bg-[#111113] border border-white/[0.08]"
      :class="sidebar
        ? 'bottom-16 left-4 w-[300px]'
        : 'top-[4.5rem] left-1/2 -translate-x-1/2 w-[300px] sm:w-[320px]'"
    >
      <!-- Now Playing Header -->
      <div class="relative p-4 pb-3">
        <!-- Close -->
        <button
          class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer"
          @click="collapse()"
        >
          <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-3.5">
          <div
            class="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl shadow-lg transition-transform duration-1000 shrink-0 bg-[#1c1c1e]"
            :class="isPlaying ? 'animate-pulse-slow' : ''"
          >
            {{ currentStation.emoji }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-white truncate leading-tight">{{ currentTrack.title }}</p>
            <p class="text-[11px] text-white/40 truncate mt-0.5">{{ currentTrack.artist }} · {{ currentStation.name }}</p>
            <div class="flex items-center gap-1.5 mt-1">
              <span v-if="isPlaying" class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                <span class="text-[10px] text-[#30d158] font-semibold">En vivo</span>
              </span>
              <span v-else-if="isLoading" class="text-[10px] text-[#ffd60a] font-semibold">Conectando...</span>
              <span v-else class="text-[10px] text-white/30 font-medium">Pausado</span>
            </div>
          </div>
        </div>

        <!-- Session progress -->
        <div v-if="sessionElapsed > 0" class="mt-3 flex items-center gap-2">
          <div class="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
            <div
              class="h-full rounded-full bg-white/40 transition-all duration-1000"
              :style="{ width: Math.min(100, (sessionElapsed / 3600) * 100) + '%' }"
            />
          </div>
          <span class="text-[9px] font-mono font-bold text-white/30 tabular-nums">{{ sessionTimeFormatted }}</span>
        </div>
      </div>

      <!-- Transport Controls -->
      <div class="px-4 pb-3 flex items-center justify-center gap-5">
        <button class="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer" @click="skipPrev()">
          <UIcon name="i-heroicons-backward" class="w-5 h-5" />
        </button>
        <button
          class="w-[52px] h-[52px] rounded-full flex items-center justify-center text-black bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-white/10"
          :disabled="isLoading"
          @click="toggle()"
        >
          <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
          <UIcon v-else-if="isPlaying" name="i-heroicons-pause" class="w-6 h-6" />
          <UIcon v-else name="i-heroicons-play" class="w-6 h-6 ml-0.5" />
        </button>
        <button class="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer" @click="skipNext()">
          <UIcon name="i-heroicons-forward" class="w-5 h-5" />
        </button>
      </div>

      <!-- Volume -->
      <div class="px-5 pb-3">
        <div class="flex items-center gap-2.5">
          <button class="text-white/25 hover:text-white/50 transition-colors cursor-pointer" @click="setVolume(volume > 0 ? 0 : 0.7)">
            <UIcon name="i-heroicons-speaker-x-mark" class="w-3.5 h-3.5" />
          </button>
          <div class="flex-1 relative h-7 flex items-center group">
            <div class="absolute inset-x-0 h-[4px] rounded-full bg-white/[0.08]" />
            <div class="absolute left-0 h-[4px] rounded-full bg-white/50 transition-all" :style="{ width: (volume * 100) + '%' }" />
            <div class="absolute w-3.5 h-3.5 rounded-full bg-white shadow-md -translate-x-1/2 transition-all opacity-0 group-hover:opacity-100" :style="{ left: (volume * 100) + '%' }" />
            <input
              type="range" min="0" max="1" step="0.02" :value="volume"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @input="setVolume(Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <button class="text-white/25 hover:text-white/50 transition-colors cursor-pointer" @click="setVolume(Math.min(1, volume + 0.1))">
            <UIcon name="i-heroicons-speaker-wave" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Quote -->
      <div class="px-5 pb-2">
        <p class="text-[10px] text-white/20 italic leading-relaxed text-center">"{{ currentQuote }}"</p>
      </div>

      <!-- Station Grid -->
      <div class="border-t border-white/[0.06]">
        <button
          class="w-full px-4 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors"
          :class="showTrackList ? 'text-white/50' : 'text-white/20 hover:text-white/40'"
          @click="toggleTrackList()"
        >
          <span>{{ stations.length }} estaciones</span>
          <UIcon :name="showTrackList ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-3.5 h-3.5" />
        </button>

        <transition name="track-list">
          <div v-if="showTrackList" class="max-h-[220px] overflow-y-auto track-list-scroll px-2 pb-2">
            <button
              v-for="station in stations"
              :key="station.id"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
              :class="currentStationId === station.id
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'"
              @click="setStation(station.id)"
            >
              <span class="text-lg shrink-0">{{ station.emoji }}</span>
              <div class="flex-1 min-w-0 text-left">
                <p class="truncate text-[12px] font-medium">{{ station.name }}</p>
                <p class="truncate text-[10px] text-white/25">{{ station.tracks[0]?.title }}</p>
              </div>
              <div v-if="isPlaying && currentStationId === station.id" class="flex items-end gap-[2px] h-3 shrink-0">
                <span class="w-[2px] rounded-full animate-bar-1 bg-white" />
                <span class="w-[2px] rounded-full animate-bar-2 bg-white" />
                <span class="w-[2px] rounded-full animate-bar-3 bg-white" />
              </div>
              <div v-else-if="currentStationId === station.id" class="w-2 h-2 rounded-full bg-white shrink-0" />
            </button>
          </div>
        </transition>
      </div>

      <!-- Error -->
      <div v-if="hasError" class="px-4 py-2 flex items-center gap-2 border-t border-red-500/20">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 text-red-400 shrink-0" />
        <p class="text-[10px] text-red-300 font-medium">{{ errorMessage }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  sidebar?: boolean
  collapsed?: boolean
}>()

const sidebarCollapsed = computed(() => props.collapsed ?? false)

// Prevent duplicate expanded panels: sidebar renders it on md+, mobile renders it on <md
const isMdScreen = ref(true)
if (import.meta.client) {
  const mql = window.matchMedia('(min-width: 768px)')
  isMdScreen.value = mql.matches
  mql.addEventListener('change', (e) => { isMdScreen.value = e.matches })
}
const showExpandedDesktop = computed(() => isMdScreen.value)
const showExpandedMobile = computed(() => !isMdScreen.value)

const {
  stations,
  currentStation,
  currentStationId,
  currentTrack,
  currentTrackIndex,
  showTrackList,
  isPlaying,
  isExpanded,
  isLoading,
  hasError,
  errorMessage,
  volume,
  sessionTimeFormatted,
  sessionElapsed,
  currentQuote,
  toggle,
  setStation,
  setVolume,
  skip,
  nextTrack,
  prevTrack,
  selectTrack,
  toggleTrackList,
  expand,
  collapse,
  resetSession,
} = useLofiPlayer()

// Skip to prev/next station (since each station = 1 live stream)
function skipPrev() {
  const idx = stations.findIndex(s => s.id === currentStationId.value)
  const prev = stations[(idx - 1 + stations.length) % stations.length]!
  setStation(prev.id)
}
function skipNext() {
  const idx = stations.findIndex(s => s.id === currentStationId.value)
  const next = stations[(idx + 1) % stations.length]!
  setStation(next.id)
}
</script>

<style scoped>
.player-slide-enter-active,
.player-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.player-slide-enter-from,
.player-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.92);
}

.track-list-enter-active,
.track-list-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.track-list-enter-from,
.track-list-leave-to {
  max-height: 0 !important;
  opacity: 0;
}
.track-list-enter-to {
  max-height: 220px;
}

.track-list-scroll::-webkit-scrollbar {
  width: 3px;
}
.track-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.track-list-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes bar1 {
  0%, 100% { height: 30%; }
  50% { height: 100%; }
}
@keyframes bar2 {
  0%, 100% { height: 70%; }
  50% { height: 20%; }
}
@keyframes bar3 {
  0%, 100% { height: 45%; }
  50% { height: 85%; }
}
.animate-bar-1 { animation: bar1 0.9s ease-in-out infinite; }
.animate-bar-2 { animation: bar2 0.7s ease-in-out infinite 0.15s; }
.animate-bar-3 { animation: bar3 0.8s ease-in-out infinite 0.3s; }

@keyframes pulse-slow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
</style>
