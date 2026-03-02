/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js')

let messagingInitialized = false

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG' && !messagingInitialized) {
    initFirebase(event.data.config)
  }
})

function initFirebase(config) {
  if (messagingInitialized) return
  messagingInitialized = true

  firebase.initializeApp({
    apiKey: config.apiKey || '',
    authDomain: config.authDomain || '',
    projectId: config.projectId || '',
    storageBucket: config.storageBucket || '',
    messagingSenderId: config.messagingSenderId || '',
    appId: config.appId || '',
  })

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'FocusFlow'
    const body = payload.notification?.body || payload.data?.body || ''

    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
    })
  })
}
