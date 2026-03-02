import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

let firebaseApp: FirebaseApp | null = null
let messaging: Messaging | null = null

function getFirebaseMessaging(): Messaging | null {
  if (!import.meta.client) return null
  if (messaging) return messaging

  const config = useRuntimeConfig()
  const fbConfig = config.public.firebase as Record<string, string> | undefined
  if (!fbConfig?.apiKey) return null

  if (getApps().length === 0) {
    firebaseApp = initializeApp(fbConfig)
  } else {
    firebaseApp = getApps()[0]!
  }

  try {
    messaging = getMessaging(firebaseApp)
  } catch {
    return null
  }

  return messaging
}

export function usePushNotifications() {
  const permission = ref<NotificationPermission>(
    import.meta.client && 'Notification' in window ? Notification.permission : 'default'
  )
  const fcmToken = ref<string | null>(null)

  async function requestPermission() {
    if (!import.meta.client || !('Notification' in window)) return
    if (permission.value === 'granted') {
      await obtainToken()
      return
    }
    const result = await Notification.requestPermission()
    permission.value = result
    if (result === 'granted') {
      await obtainToken()
    }
  }

  async function obtainToken() {
    const msg = getFirebaseMessaging()
    if (!msg) return

    const config = useRuntimeConfig()
    const vapidKey = (config.public.firebase as Record<string, string> | undefined)?.vapidKey
    if (!vapidKey) return

    try {
      const token = await getToken(msg, { vapidKey })
      if (token) {
        fcmToken.value = token
        await registerToken(token)
      }
    } catch (err) {
      console.warn('[push] Failed to get FCM token:', err)
    }
  }

  async function registerToken(token: string) {
    const store = useWorkspaceStore()
    const workspaceId = store.workspace?.id
    if (!workspaceId) return

    try {
      await $fetch(`/api/workspaces/${workspaceId}/fcm-token`, {
        method: 'POST',
        body: { token },
      })
    } catch {
      // Token registration failed silently
    }
  }

  function listenForeground(callback: (payload: { title: string; body?: string }) => void) {
    const msg = getFirebaseMessaging()
    if (!msg) return

    onMessage(msg, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'FocusFlow'
      const body = payload.notification?.body || payload.data?.body || undefined
      callback({ title, body })
    })
  }

  /**
   * Local notification for pomodoro (no FCM needed, uses Notification API directly)
   */
  function sendLocal(title: string, options?: NotificationOptions) {
    if (!import.meta.client || permission.value !== 'granted') return
    const notif = new Notification(title, {
      icon: '/favicon.ico',
      ...options,
    })
    setTimeout(() => notif.close(), 8000)
  }

  function playSound() {
    if (!import.meta.client) return
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.25)
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {
      // Web Audio not available
    }
  }

  return { permission, fcmToken, requestPermission, listenForeground, sendLocal, playSound }
}
