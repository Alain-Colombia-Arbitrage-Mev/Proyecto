import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

let adminApp: App | null = null

function getAdminApp(): App | null {
  if (adminApp) return adminApp
  if (getApps().length > 0) {
    adminApp = getApps()[0]!
    return adminApp
  }

  const config = useRuntimeConfig()
  const serviceAccount = config.firebaseServiceAccountJson as string | undefined
  if (!serviceAccount) return null

  try {
    const parsed = JSON.parse(serviceAccount)
    adminApp = initializeApp({ credential: cert(parsed) })
    return adminApp
  } catch (err) {
    console.error('[firebase] Admin SDK init failed:', err)
    return null
  }
}

interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushNotification(tokens: string[], payload: PushPayload): Promise<number> {
  if (tokens.length === 0) return 0

  const app = getAdminApp()
  if (!app) return 0

  const messaging = getMessaging(app)
  let sent = 0

  // FCM sendEachForMulticast handles up to 500 tokens per call
  const batchSize = 500
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize)

    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        webpush: {
          fcmOptions: {
            link: '/',
          },
        },
      })
      sent += response.successCount
    } catch (err) {
      console.error('[firebase] Push send failed:', err)
    }
  }

  return sent
}
