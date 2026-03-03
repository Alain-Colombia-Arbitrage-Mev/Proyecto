export default defineNuxtPlugin(async () => {
  if (!('serviceWorker' in navigator)) return

  const config = useRuntimeConfig()
  const fbConfig = config.public.firebase as Record<string, string> | undefined
  if (!fbConfig?.apiKey) return

  // Extract plain object from reactive proxy — postMessage requires cloneable data
  const plainConfig = {
    apiKey: fbConfig.apiKey,
    authDomain: fbConfig.authDomain,
    projectId: fbConfig.projectId,
    storageBucket: fbConfig.storageBucket,
    messagingSenderId: fbConfig.messagingSenderId,
    appId: fbConfig.appId,
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // Wait for the SW to be active, then send config
    const sw = registration.active || registration.installing || registration.waiting
    if (sw) {
      const sendConfig = () => {
        sw.postMessage({ type: 'FIREBASE_CONFIG', config: plainConfig })
      }
      if (sw.state === 'activated') {
        sendConfig()
      } else {
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') sendConfig()
        })
      }
    }
  } catch (err) {
    console.warn('[firebase-sw] Registration failed:', err)
  }
})
