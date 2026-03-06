export interface LofiTrack {
  title: string
  artist: string
  duration: string
}

export interface LofiStation {
  id: string
  name: string
  emoji: string
  url: string
  color: string
  fallbackUrls: string[]
  tracks: LofiTrack[]
  type?: 'stream' | 'youtube'  // default: 'stream'
  youtubeId?: string            // YouTube video ID for type='youtube'
}

// Stream sources: YouTube embeds are most reliable for 24/7 streams.
// Self-hosted audio from Supabase storage can be added as primary URLs.
// Format: set type='youtube' + youtubeId for YouTube, or url for direct stream.
const stations: LofiStation[] = [
  // === TOP PICKS ===
  {
    id: 'hiphop',
    name: 'Hip Hop',
    emoji: '🎤',
    url: '',
    color: '#EF4444',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'WN9G_VnluX4',
    tracks: [
      { title: 'Hip Hop Radio', artist: 'Hip Hop Mix', duration: 'LIVE' },
    ],
  },
  {
    id: 'lofi-hiphop',
    name: 'Work With Me',
    emoji: '🎧',
    url: '',
    color: '#8B5CF6',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'jfKfPfyJRdk', // lofi girl - most reliable 24/7 stream
    tracks: [
      { title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', duration: 'LIVE' },
    ],
  },
  {
    id: 'productividad',
    name: 'Productividad',
    emoji: '🚀',
    url: '',
    color: '#F59E0B',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'foB5El2jxFs',
    tracks: [
      { title: 'Aumenta tu productividad', artist: 'Focus Music', duration: 'LIVE' },
    ],
  },
  {
    id: 'jazz-cafe',
    name: 'Jazz Cafe',
    emoji: '🎷',
    url: '',
    color: '#10B981',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'MYPVQccHhAQ', // Cozy coffee shop jazz
    tracks: [
      { title: 'Smooth Piano Jazz', artist: 'Cozy Coffee Shop', duration: 'LIVE' },
    ],
  },
  // === HIGH ENERGY ===
  {
    id: 'synthwave',
    name: 'Synthwave',
    emoji: '🌌',
    url: '',
    color: '#E040FB',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: '4xDzrJKXOOY',
    tracks: [
      { title: 'Synthwave Radio', artist: 'Lofi Girl', duration: 'LIVE' },
    ],
  },
  {
    id: 'chillsynth',
    name: 'ChillSynth FM',
    emoji: '🕹️',
    url: '',
    color: '#7C3AED',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'UedTcufyrHc',
    tracks: [
      { title: 'Lofi Synthwave Radio', artist: 'ChillSynth FM', duration: 'LIVE' },
    ],
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    emoji: '⚡',
    url: '',
    color: '#0EA5E9',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'oPVte6aMprI',
    tracks: [
      { title: 'Music for Concentration', artist: 'Deep Focus', duration: 'LIVE' },
    ],
  },
  {
    id: 'good-life',
    name: 'House & Energy',
    emoji: '🔥',
    url: '',
    color: '#F97316',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: '36YnV9STBqc',
    tracks: [
      { title: '24/7 House Radio', artist: 'The Good Life', duration: 'LIVE' },
    ],
  },
  // === FOCUS / STUDY ===
  {
    id: 'late-night',
    name: '1AM Study',
    emoji: '🌙',
    url: '',
    color: '#6366F1',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'lTRiuFIWV54',
    tracks: [
      { title: '1 A.M Study Session', artist: 'Lofi Girl', duration: 'LIVE' },
    ],
  },
  {
    id: 'chillhop',
    name: 'Chill & Focus',
    emoji: '☕',
    url: '',
    color: '#F59E0B',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: '5yx6BWlEVcY',
    tracks: [
      { title: 'Chillhop Radio', artist: 'Chillhop Music', duration: 'LIVE' },
    ],
  },
  // === CLASSICAL / AMBIENT ===
  {
    id: 'classical',
    name: 'Classical',
    emoji: '🎻',
    url: '',
    color: '#B45309',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'mIYzp5rcTvU',
    tracks: [
      { title: 'Classical for Reading', artist: 'Mozart, Chopin, Debussy', duration: 'LIVE' },
    ],
  },
  {
    id: 'nature',
    name: 'Naturaleza',
    emoji: '🌿',
    url: '',
    color: '#059669',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'eKFTSSKCzWA',
    tracks: [
      { title: 'Rain & Thunder', artist: 'Nature Sounds', duration: 'LIVE' },
    ],
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    emoji: '🔇',
    url: '',
    color: '#6B7280',
    fallbackUrls: [],
    type: 'youtube',
    youtubeId: 'nMfPqeZjc2c',
    tracks: [
      { title: 'White Noise', artist: 'Deep Focus', duration: 'LIVE' },
    ],
  },
]

const motivationalQuotes = [
  'Un pequeño paso hoy, un gran avance mañana.',
  'No tienes que ser perfecto, solo constante.',
  'Cada tarea completada es una victoria.',
  'Tu enfoque de hoy construye tu futuro.',
  'Comienza. Lo demás se acomoda en el camino.',
  'La concentración es tu superpoder.',
  'Progreso > Perfección.',
  'Respira. Enfócate. Ejecuta.',
  'La disciplina es libertad.',
  'Hoy es un buen día para avanzar.',
  'No cuentes los días, haz que los días cuenten.',
  'El momentum se construye con acción.',
]

// Singleton state shared across components
const isPlaying = ref(false)
const isExpanded = ref(false)
const currentStationId = ref('lofi-hiphop')
const volume = ref(0.7)
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const currentTrackIndex = ref(0)
const showTrackList = ref(false)

// Session timer
const sessionStartTime = ref<number | null>(null)
const sessionElapsed = ref(0)
let sessionInterval: ReturnType<typeof setInterval> | null = null

// Motivational quote
const currentQuote = ref(motivationalQuotes[0]!)

let audio: HTMLAudioElement | null = null
let fallbackIndex = 0

// YouTube IFrame Player support
let ytPlayer: any = null
let ytReady = false
let ytContainer: HTMLDivElement | null = null

function ensureYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as any).YT && (window as any).YT.Player) return Promise.resolve()

  return new Promise((resolve) => {
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      // Script already loading, wait for callback
      const prev = (window as any).onYouTubeIframeAPIReady
      ;(window as any).onYouTubeIframeAPIReady = () => {
        if (prev) prev()
        resolve()
      }
      return
    }
    (window as any).onYouTubeIframeAPIReady = () => resolve()
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
}

function createYTPlayer(videoId: string, vol: number): Promise<void> {
  return new Promise((resolve) => {
    // Create hidden container if needed
    if (!ytContainer) {
      ytContainer = document.createElement('div')
      ytContainer.id = 'yt-lofi-player'
      ytContainer.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;'
      document.body.appendChild(ytContainer)

      const inner = document.createElement('div')
      inner.id = 'yt-lofi-inner'
      ytContainer.appendChild(inner)
    }

    if (ytPlayer) {
      try { ytPlayer.destroy() } catch {}
      ytPlayer = null
      // Recreate inner div
      const el = ytContainer.querySelector('#yt-lofi-inner')
      if (el) el.remove()
      const inner = document.createElement('div')
      inner.id = 'yt-lofi-inner'
      ytContainer.appendChild(inner)
    }

    ytPlayer = new (window as any).YT.Player('yt-lofi-inner', {
      videoId,
      playerVars: { autoplay: 1, loop: 1, playlist: videoId },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(vol * 100)
          event.target.playVideo()
          ytReady = true
          resolve()
        },
        onStateChange: (event: any) => {
          const YT = (window as any).YT
          if (event.data === YT.PlayerState.PLAYING) {
            isLoading.value = false
            isPlaying.value = true
            hasError.value = false
          } else if (event.data === YT.PlayerState.BUFFERING) {
            isLoading.value = true
          } else if (event.data === YT.PlayerState.ENDED) {
            // Loop: restart
            event.target.playVideo()
          }
        },
        onError: () => {
          isLoading.value = false
          isPlaying.value = false
          // Auto-skip to next station on error
          const idx = stations.findIndex(s => s.id === currentStationId.value)
          const next = stations[(idx + 1) % stations.length]!
          console.warn(`[lofi] Station "${currentStationId.value}" failed, skipping to "${next.id}"`)
          hasError.value = true
          errorMessage.value = 'Saltando a siguiente estación...'
          setTimeout(() => {
            hasError.value = false
            errorMessage.value = ''
            // Switch station and replay via module-level state
            currentStationId.value = next.id
            currentTrackIndex.value = 0
            if (next.type === 'youtube' && next.youtubeId) {
              createYTPlayer(next.youtubeId, volume.value).catch(() => {})
            }
          }, 1500)
        },
      },
    })
  })
}

function destroyYTPlayer() {
  if (ytPlayer) {
    try { ytPlayer.pauseVideo() } catch {}
    try { ytPlayer.destroy() } catch {}
    ytPlayer = null
    ytReady = false
  }
}

export function useLofiPlayer() {
  const currentStation = computed(() =>
    stations.find(s => s.id === currentStationId.value) || stations[0]!
  )

  const currentTrack = computed(() => {
    const station = currentStation.value
    return station.tracks[currentTrackIndex.value] || station.tracks[0] || { title: 'Live Stream', artist: station.name, duration: '--:--' }
  })

  const sessionTimeFormatted = computed(() => {
    const secs = sessionElapsed.value
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
    return `${m}:${String(s).padStart(2, '0')}`
  })

  function rotateQuote() {
    const idx = Math.floor(Math.random() * motivationalQuotes.length)
    currentQuote.value = motivationalQuotes[idx]!
  }

  function startSessionTimer() {
    if (sessionInterval) return
    if (!sessionStartTime.value) sessionStartTime.value = Date.now()
    sessionInterval = setInterval(() => {
      if (sessionStartTime.value) {
        sessionElapsed.value = Math.floor((Date.now() - sessionStartTime.value) / 1000)
      }
    }, 1000)
  }

  function stopSessionTimer() {
    if (sessionInterval) {
      clearInterval(sessionInterval)
      sessionInterval = null
    }
  }

  function resetSession() {
    stopSessionTimer()
    sessionStartTime.value = null
    sessionElapsed.value = 0
  }

  function initAudio() {
    if (typeof window === 'undefined') return
    if (!audio) {
      audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.preload = 'none'

      audio.addEventListener('playing', () => {
        isLoading.value = false
        isPlaying.value = true
        hasError.value = false
        errorMessage.value = ''
        fallbackIndex = 0
        startSessionTimer()
      })

      audio.addEventListener('waiting', () => {
        isLoading.value = true
      })

      audio.addEventListener('error', () => {
        // Try fallback URLs before giving up
        const station = currentStation.value
        if (fallbackIndex < station.fallbackUrls.length) {
          const fallbackUrl = station.fallbackUrls[fallbackIndex]!
          fallbackIndex++
          console.log(`[lofi] Trying fallback #${fallbackIndex} for ${station.name}`)
          audio!.src = fallbackUrl
          audio!.play().catch(() => {
            handlePlaybackError()
          })
        } else {
          handlePlaybackError()
        }
      })

      // When stream ends (rare for radio), auto-restart
      audio.addEventListener('ended', () => {
        if (isPlaying.value) {
          setTimeout(() => play(), 2000)
        }
      })

      // Stall recovery
      audio.addEventListener('stalled', () => {
        isLoading.value = true
        setTimeout(() => {
          if (isLoading.value && audio) {
            audio.load()
            audio.play().catch(() => {})
          }
        }, 5000)
      })
    }
  }

  function handlePlaybackError() {
    isLoading.value = false
    isPlaying.value = false
    hasError.value = true
    errorMessage.value = 'Stream no disponible. Intenta otra estación.'
    stopSessionTimer()
  }

  function loadState() {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('focusflow-lofi')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.stationId && stations.some(s => s.id === data.stationId)) {
          currentStationId.value = data.stationId
        }
        if (typeof data.volume === 'number') {
          volume.value = Math.max(0, Math.min(1, data.volume))
        }
      }
    } catch {}
    rotateQuote()
  }

  function saveState() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('focusflow-lofi', JSON.stringify({
        stationId: currentStationId.value,
        volume: volume.value,
      }))
    } catch {}
  }

  async function play() {
    const station = currentStation.value

    if (station.type === 'youtube' && station.youtubeId) {
      // YouTube playback
      isLoading.value = true
      hasError.value = false
      errorMessage.value = ''

      // Pause regular audio if playing
      if (audio) { audio.pause(); audio.src = '' }

      try {
        await ensureYouTubeAPI()
        if (ytPlayer && ytReady) {
          ytPlayer.playVideo()
        } else {
          await createYTPlayer(station.youtubeId, volume.value)
        }
        startSessionTimer()
      } catch {
        isLoading.value = false
        hasError.value = true
        errorMessage.value = 'YouTube: error al iniciar.'
      }
      saveState()
      return
    }

    // Regular stream playback
    destroyYTPlayer()
    initAudio()
    if (!audio) return
    isLoading.value = true
    hasError.value = false
    errorMessage.value = ''
    fallbackIndex = 0
    audio.src = station.url
    audio.volume = volume.value
    try {
      await audio.play()
    } catch {
      // Error handler will attempt fallbacks
    }
    saveState()
  }

  function pause() {
    // Pause YouTube if active
    if (currentStation.value.type === 'youtube' && ytPlayer && ytReady) {
      try { ytPlayer.pauseVideo() } catch {}
      isPlaying.value = false
      isLoading.value = false
      stopSessionTimer()
      return
    }

    if (!audio) return
    audio.pause()
    isPlaying.value = false
    isLoading.value = false
    stopSessionTimer()
  }

  function toggle() {
    if (isPlaying.value) pause()
    else play()
  }

  function setStation(stationId: string) {
    // Stop current playback
    if (audio) { audio.pause(); audio.src = '' }
    destroyYTPlayer()
    isPlaying.value = false

    currentStationId.value = stationId
    currentTrackIndex.value = 0
    hasError.value = false
    errorMessage.value = ''
    fallbackIndex = 0
    saveState()
    rotateQuote()
    play()
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
    if (audio) audio.volume = volume.value
    // Also update YouTube volume
    if (ytPlayer && ytReady) {
      try { ytPlayer.setVolume(volume.value * 100) } catch {}
    }
    saveState()
  }

  function nextTrack() {
    const station = currentStation.value
    currentTrackIndex.value = (currentTrackIndex.value + 1) % station.tracks.length
  }

  function prevTrack() {
    const station = currentStation.value
    currentTrackIndex.value = currentTrackIndex.value > 0
      ? currentTrackIndex.value - 1
      : station.tracks.length - 1
  }

  function selectTrack(index: number) {
    currentTrackIndex.value = index
  }

  function toggleTrackList() {
    showTrackList.value = !showTrackList.value
  }

  function skip() {
    const idx = stations.findIndex(s => s.id === currentStationId.value)
    const next = stations[(idx + 1) % stations.length]!
    setStation(next.id)
  }

  function expand() {
    isExpanded.value = true
  }

  function collapse() {
    isExpanded.value = false
  }

  function suggestFocusMusic() {
    expand()
    rotateQuote()
    if (!isPlaying.value) play()
  }

  // Load saved state on first use (client only)
  if (import.meta.client) loadState()

  return {
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
    play,
    pause,
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
    suggestFocusMusic,
    resetSession,
  }
}
