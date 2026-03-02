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
    tracks: [
      { title: 'Midnight Coffee', artist: 'Lofi Dreamer', duration: '3:24' },
      { title: 'Rainy Window', artist: 'Chillhop Music', duration: '2:58' },
      { title: 'Study Session', artist: 'Beats by Nola', duration: '3:42' },
      { title: 'Paper Planes', artist: 'Kupla', duration: '2:15' },
      { title: 'Autumn Leaves', artist: 'Mellow Vibes', duration: '4:01' },
      { title: 'City Lights', artist: 'Lofi Dreamer', duration: '3:33' },
      { title: 'Morning Brew', artist: 'Sleepy Fish', duration: '2:47' },
      { title: 'Sunset Drive', artist: 'Philanthrope', duration: '3:18' },
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
    tracks: [
      { title: 'Warm Glow', artist: 'Aso', duration: '3:12' },
      { title: 'Focus Mode', artist: 'Idealism', duration: '2:44' },
      { title: 'Vanilla Latte', artist: 'Jazzinuf', duration: '3:56' },
      { title: 'Quiet Hours', artist: 'Leavv', duration: '2:31' },
      { title: 'Bookstore', artist: 'Wun Two', duration: '3:08' },
      { title: 'Daydream', artist: 'In Love With a Ghost', duration: '2:55' },
      { title: 'Golden Hour', artist: 'Aso', duration: '3:40' },
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
    tracks: [
      { title: 'Ocean Drift', artist: 'Ambient World', duration: '5:12' },
      { title: 'Cosmic Waves', artist: 'Stars of the Lid', duration: '7:23' },
      { title: 'Deep Space', artist: 'Brian Eno', duration: '6:44' },
      { title: 'Underwater', artist: 'Hammock', duration: '4:58' },
      { title: 'Cloud Atlas', artist: 'Tycho', duration: '5:31' },
      { title: 'Aurora', artist: 'Ambient World', duration: '6:02' },
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
    tracks: [
      { title: 'Blue Note Session', artist: 'Jazz Vibes', duration: '4:15' },
      { title: 'Smooth Sax', artist: 'Late Night Jazz', duration: '3:42' },
      { title: 'Cafe Paris', artist: 'Bossa Nova Trio', duration: '3:58' },
      { title: 'Piano Bar', artist: 'Jazz Collective', duration: '4:30' },
      { title: 'Swing Low', artist: 'Vintage Jazz', duration: '3:22' },
      { title: 'Midnight Blues', artist: 'Jazz Vibes', duration: '5:01' },
      { title: 'Gentle Keys', artist: 'Piano Lounge', duration: '3:45' },
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
    tracks: [
      { title: 'Rain Forest', artist: 'Nature Sounds', duration: '8:00' },
      { title: 'Creek & Birds', artist: 'Calm Nature', duration: '6:30' },
      { title: 'Thunder Calm', artist: 'Storm Sounds', duration: '7:15' },
      { title: 'Wind Meadow', artist: 'Nature Sounds', duration: '5:45' },
      { title: 'Ocean Shore', artist: 'Calm Nature', duration: '9:00' },
      { title: 'Night Cricket', artist: 'Nocturnal', duration: '6:20' },
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
    tracks: [
      { title: 'Pure White', artist: 'Noise Generator', duration: '10:00' },
      { title: 'Pink Noise', artist: 'Sleep Aid', duration: '10:00' },
      { title: 'Brown Noise', artist: 'Deep Focus', duration: '10:00' },
      { title: 'Fan Humming', artist: 'Ambient Machine', duration: '8:00' },
      { title: 'Static Calm', artist: 'Noise Generator', duration: '10:00' },
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
    currentTrackIndex.value = 0
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

  // Load saved state on first use
  loadState()

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
