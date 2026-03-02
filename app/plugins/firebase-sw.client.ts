export default defineNuxtPlugin(async () => {
  if (!('serviceWorker' in navigator)) return

  const config = useRuntimeConfig()
  const fbConfig = config.public.firebase as Record<string, string> | undefined
  if (!fbConfig?.apiKey) return

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // Wait for the SW to be active, then send config
    const sw = registration.active || registration.installing || registration.waiting
    if (sw) {
      if (sw.state === 'activated') {
        sw.postMessage({ type: 'FIREBASE_CONFIG', config: fbConfig })
      } else {
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') {
            sw.postMessage({ type: 'FIREBASE_CONFIG', config: fbConfig })
          }
        })
      }
    }
  } catch (err) {
    console.warn('[firebase-sw] Registration failed:', err)
  }
})
