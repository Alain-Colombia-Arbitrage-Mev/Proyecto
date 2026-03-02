export interface LofiStation {
  id: string
  name: string
  emoji: string
  url: string
  color: string
  fallbackUrls: string[]
}

// Reliable 24/7 internet radio streams with fallbacks
const stations: LofiStation[] = [
  {
    id: 'lofi-hiphop',
    name: 'Lofi Hip Hop',
    emoji: '🎧',
    url: 'https://stream.zeno.fm/0r0xa792kwzuv',
    color: '#8B5CF6',
    fallbackUrls: [
      'https://stream.zeno.fm/yan2rq923fhvv',
      'https://stream.zeno.fm/4lygnz923fhvv',
    ],
  },
  {
    id: 'chillhop',
    name: 'Chill & Focus',
    emoji: '☕',
    url: 'https://stream.zeno.fm/yan2rq923fhvv',
    color: '#F59E0B',
    fallbackUrls: [
      'https://stream.zeno.fm/0r0xa792kwzuv',
      'https://stream.zeno.fm/f3wvbbqmdg8uv',
    ],
  },
  {
    id: 'ambient',
    name: 'Ambient Deep',
    emoji: '🌊',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    color: '#3B82F6',
    fallbackUrls: [
      'https://stream.zeno.fm/kvnlxbtmcg8uv',
      'https://stream.zeno.fm/4lygnz923fhvv',
    ],
  },
  {
    id: 'jazz-study',
    name: 'Jazz Study',
    emoji: '🎷',
    url: 'https://stream.zeno.fm/4lygnz923fhvv',
    color: '#10B981',
    fallbackUrls: [
      'https://stream.zeno.fm/0r0xa792kwzuv',
      'https://stream.zeno.fm/yan2rq923fhvv',
    ],
  },
  {
    id: 'nature',
    name: 'Naturaleza',
    emoji: '🌿',
    url: 'https://stream.zeno.fm/kvnlxbtmcg8uv',
    color: '#059669',
    fallbackUrls: [
      'https://stream.zeno.fm/f3wvbbqmdg8uv',
      'https://stream.zeno.fm/2x3mpsq4yzzuv',
    ],
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    emoji: '🔇',
    url: 'https://stream.zeno.fm/2x3mpsq4yzzuv',
    color: '#6B7280',
    fallbackUrls: [
      'https://stream.zeno.fm/kvnlxbtmcg8uv',
      'https://stream.zeno.fm/f3wvbbqmdg8uv',
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

// Session timer
const sessionStartTime = ref<number | null>(null)
const sessionElapsed = ref(0)
let sessionInterval: ReturnType<typeof setInterval> | null = null

// Motivational quote
const currentQuote = ref(motivationalQuotes[0]!)

let audio: HTMLAudioElement | null = null
let fallbackIndex = 0

export function useLofiPlayer() {
  const currentStation = computed(() =>
    stations.find(s => s.id === currentStationId.value) || stations[0]!
  )

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
    initAudio()
    if (!audio) return
    isLoading.value = true
    hasError.value = false
    errorMessage.value = ''
    fallbackIndex = 0
    audio.src = currentStation.value.url
    audio.volume = volume.value
    try {
      await audio.play()
    } catch {
      // Error handler will attempt fallbacks
    }
    saveState()
  }

  function pause() {
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
    const wasPlaying = isPlaying.value
    if (audio) {
      audio.pause()
      isPlaying.value = false
    }
    currentStationId.value = stationId
    hasError.value = false
    errorMessage.value = ''
    fallbackIndex = 0
    saveState()
    rotateQuote()
    if (wasPlaying) play()
  }

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(1, v))
    if (audio) audio.volume = volume.value
    saveState()
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

  // Load saved state on first use
  loadState()

  return {
    stations,
    currentStation,
    currentStationId,
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
    expand,
    collapse,
    suggestFocusMusic,
    resetSession,
  }
}
