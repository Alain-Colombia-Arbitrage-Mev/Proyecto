<template>
  <!-- FAB Button (collapsed state) -->
  <button
    v-if="!isExpanded"
    class="fixed bottom-20 left-4 md:bottom-6 md:left-auto md:right-6 z-40 cursor-pointer group"
    @click="expand()"
    title="Focus Music"
  >
    <div
      class="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110"
      :style="{ background: `linear-gradient(135deg, ${currentStation.color}, ${currentStation.color}dd)` }"
    >
      <span v-if="!isPlaying" class="text-lg">{{ currentStation.emoji }}</span>
      <!-- Animated bars when playing -->
      <div v-else class="flex items-end gap-[3px] h-5">
        <span class="w-[3px] bg-white/90 rounded-full animate-bar-1" />
        <span class="w-[3px] bg-white/90 rounded-full animate-bar-2" />
        <span class="w-[3px] bg-white/90 rounded-full animate-bar-3" />
        <span class="w-[3px] bg-white/90 rounded-full animate-bar-4" />
      </div>
    </div>
    <!-- Session time badge -->
    <div
      v-if="isPlaying && sessionElapsed > 0"
      class="absolute -top-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-sm"
      :style="{ backgroundColor: currentStation.color }"
    >
      {{ sessionTimeFormatted }}
    </div>
  </button>

  <!-- Expanded Player -->
  <transition name="player-slide">
    <div
      v-if="isExpanded"
      class="fixed bottom-20 left-4 md:bottom-6 md:left-auto md:right-6 w-80 z-40 rounded-2xl shadow-2xl overflow-hidden border border-white/20"
      style="backdrop-filter: blur(20px);"
    >
      <!-- Gradient Header with Now Playing -->
      <div
        class="relative px-5 pt-4 pb-3"
        :style="{ background: `linear-gradient(135deg, ${currentStation.color}18, ${currentStation.color}08)` }"
      >
        <!-- Close button -->
        <button
          class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-all cursor-pointer"
          @click="collapse()"
        >
          <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-3">
          <!-- Animated album art -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner transition-transform duration-1000"
            :class="isPlaying ? 'animate-pulse-slow' : ''"
            :style="{ background: `linear-gradient(135deg, ${currentStation.color}30, ${currentStation.color}15)` }"
          >
            {{ currentStation.emoji }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Ahora sonando</p>
            <p class="text-sm font-bold text-gray-900 truncate">{{ currentTrack.title }}</p>
            <p class="text-[10px] text-gray-500 truncate">{{ currentTrack.artist }} &middot; {{ currentStation.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span v-if="isPlaying" class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span class="text-[10px] text-emerald-600 font-semibold">En vivo</span>
              </span>
              <span v-else-if="isLoading" class="text-[10px] text-amber-600 font-semibold">Conectando...</span>
              <span v-else class="text-[10px] text-gray-400 font-medium">Pausado</span>
            </div>
          </div>
        </div>

        <!-- Session timer -->
        <div v-if="sessionElapsed > 0" class="mt-2.5 flex items-center gap-2">
          <div class="flex-1 h-1 rounded-full bg-gray-200/60 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-1000"
              :style="{
                backgroundColor: currentStation.color + '80',
                width: Math.min(100, (sessionElapsed / 3600) * 100) + '%',
              }"
            />
          </div>
          <span class="text-[10px] font-mono font-bold tabular-nums" :style="{ color: currentStation.color }">
            {{ sessionTimeFormatted }}
          </span>
        </div>
      </div>

      <!-- Motivational quote -->
      <div class="px-5 py-2 bg-white/80">
        <p class="text-[10px] text-gray-500 italic leading-relaxed text-center">
          "{{ currentQuote }}"
        </p>
      </div>

      <!-- Main Controls -->
      <div class="bg-white px-5 py-3 flex items-center justify-center gap-3">
        <!-- Prev track -->
        <button
          class="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          @click="prevTrack()"
          title="Tema anterior"
        >
          <UIcon name="i-heroicons-backward" class="w-4 h-4" />
        </button>

        <!-- Play/Pause (big button) -->
        <button
          class="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          :style="{ background: `linear-gradient(135deg, ${currentStation.color}, ${currentStation.color}cc)` }"
          :disabled="isLoading"
          @click="toggle()"
        >
          <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
          <UIcon v-else-if="isPlaying" name="i-heroicons-pause" class="w-6 h-6" />
          <UIcon v-else name="i-heroicons-play" class="w-6 h-6 ml-0.5" />
        </button>

        <!-- Next track -->
        <button
          class="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          @click="nextTrack()"
          title="Siguiente tema"
        >
          <UIcon name="i-heroicons-forward" class="w-4 h-4" />
        </button>

        <!-- Track list toggle -->
        <button
          class="w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer"
          :class="showTrackList ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'"
          @click="toggleTrackList()"
          title="Lista de canciones"
        >
          <UIcon name="i-heroicons-queue-list" class="w-4 h-4" />
        </button>
      </div>

      <!-- Volume Control -->
      <div class="bg-white px-5 pb-3">
        <div class="flex items-center gap-3">
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            @click="setVolume(volume > 0 ? 0 : 0.7)"
          >
            <UIcon :name="volume === 0 ? 'i-heroicons-speaker-x-mark' : 'i-heroicons-speaker-wave'" class="w-4 h-4" />
          </button>
          <div class="flex-1 relative h-8 flex items-center group">
            <!-- Track bg -->
            <div class="absolute inset-x-0 h-1.5 rounded-full bg-gray-100" />
            <!-- Track fill -->
            <div
              class="absolute left-0 h-1.5 rounded-full transition-all"
              :style="{
                width: (volume * 100) + '%',
                background: `linear-gradient(90deg, ${currentStation.color}80, ${currentStation.color})`,
              }"
            />
            <!-- Thumb -->
            <div
              class="absolute w-4 h-4 rounded-full bg-white shadow-md border-2 -translate-x-1/2 transition-transform group-hover:scale-110"
              :style="{
                left: (volume * 100) + '%',
                borderColor: currentStation.color,
              }"
            />
            <!-- Invisible range input -->
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              :value="volume"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @input="setVolume(Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <span class="text-[10px] font-mono font-bold text-gray-400 w-7 text-right tabular-nums">
            {{ Math.round(volume * 100) }}
          </span>
        </div>
      </div>

      <!-- Track List (expandable) -->
      <transition name="track-list">
        <div v-if="showTrackList" class="bg-white border-t border-gray-100 max-h-[180px] overflow-y-auto track-list-scroll">
          <div class="px-3 py-2">
            <p class="text-[9px] font-bold uppercase tracking-widest text-gray-300 px-2 mb-1.5">
              Canciones &middot; {{ currentStation.tracks.length }} temas
            </p>
            <div class="space-y-0.5">
              <button
                v-for="(track, idx) in currentStation.tracks"
                :key="idx"
                class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                :class="currentTrackIndex === idx
                  ? 'font-semibold text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'"
                :style="currentTrackIndex === idx ? { backgroundColor: currentStation.color + '10' } : {}"
                @click="selectTrack(idx)"
              >
                <!-- Track number / playing indicator -->
                <span class="w-5 text-center shrink-0">
                  <span v-if="isPlaying && currentTrackIndex === idx" class="flex items-end justify-center gap-[2px] h-3">
                    <span class="w-[2px] rounded-full animate-bar-1" :style="{ backgroundColor: currentStation.color }" />
                    <span class="w-[2px] rounded-full animate-bar-2" :style="{ backgroundColor: currentStation.color }" />
                    <span class="w-[2px] rounded-full animate-bar-3" :style="{ backgroundColor: currentStation.color }" />
                  </span>
                  <span v-else class="text-[10px] tabular-nums" :style="currentTrackIndex === idx ? { color: currentStation.color } : {}">{{ idx + 1 }}</span>
                </span>
                <!-- Track info -->
                <div class="flex-1 min-w-0 text-left">
                  <p class="truncate text-[11px]">{{ track.title }}</p>
                  <p class="truncate text-[9px] text-gray-400">{{ track.artist }}</p>
                </div>
                <!-- Duration -->
                <span class="text-[10px] text-gray-400 tabular-nums shrink-0">{{ track.duration }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Error message -->
      <div v-if="hasError" class="bg-red-50 px-5 py-2 flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 text-red-400 shrink-0" />
        <p class="text-[10px] text-red-600 font-medium">{{ errorMessage }}</p>
      </div>

      <!-- Station Selector -->
      <div class="bg-white border-t border-gray-100 px-3 py-2 max-h-[200px] overflow-y-auto">
        <p class="text-[9px] font-bold uppercase tracking-widest text-gray-300 px-2 mb-1.5">Estaciones</p>
        <div class="space-y-0.5">
          <button
            v-for="station in stations"
            :key="station.id"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer"
            :class="currentStationId === station.id
              ? 'font-bold text-gray-900'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'"
            :style="currentStationId === station.id ? { backgroundColor: station.color + '10' } : {}"
            @click="setStation(station.id)"
          >
            <span class="text-base">{{ station.emoji }}</span>
            <span class="flex-1 text-left">{{ station.name }}</span>
            <!-- Playing indicator -->
            <div
              v-if="isPlaying && currentStationId === station.id"
              class="flex items-end gap-[2px] h-3"
            >
              <span class="w-[2px] rounded-full animate-bar-1" :style="{ backgroundColor: station.color }" />
              <span class="w-[2px] rounded-full animate-bar-2" :style="{ backgroundColor: station.color }" />
              <span class="w-[2px] rounded-full animate-bar-3" :style="{ backgroundColor: station.color }" />
            </div>
            <div
              v-else-if="currentStationId === station.id"
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: station.color }"
            />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
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
</script>

<style scoped>
.player-slide-enter-active,
.player-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
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
  max-height: 180px;
}

.track-list-scroll::-webkit-scrollbar {
  width: 4px;
}
.track-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.track-list-scroll::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}

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
@keyframes bar4 {
  0%, 100% { height: 60%; }
  50% { height: 35%; }
}
.animate-bar-1 { animation: bar1 0.9s ease-in-out infinite; }
.animate-bar-2 { animation: bar2 0.7s ease-in-out infinite 0.15s; }
.animate-bar-3 { animation: bar3 0.8s ease-in-out infinite 0.3s; }
.animate-bar-4 { animation: bar4 0.65s ease-in-out infinite 0.1s; }

@keyframes pulse-slow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }

/* Custom scrollbar for stations list */
.max-h-\[200px\]::-webkit-scrollbar {
  width: 4px;
}
.max-h-\[200px\]::-webkit-scrollbar-track {
  background: transparent;
}
.max-h-\[200px\]::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}
</style>
