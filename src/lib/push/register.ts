import { getVapidPublicKey } from './capabilities'

const SW_URL = '/sw.js'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

export async function initPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Genza] service worker unsupported in this browser')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' })
    console.log('[Genza] service worker registered', { scope: registration.scope })
    return registration
  } catch (error) {
    console.warn('[Genza] service worker registration failed:', error)
    return null
  }
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing) return existing

  return initPwaServiceWorker()
}

export async function subscribeBrowserPush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const vapidKey = getVapidPublicKey()
  if (!vapidKey) {
    console.warn('[Genza] push subscribe skipped — VITE_VAPID_PUBLIC_KEY not set')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.log('[Genza] push permission not granted', { permission })
    return null
  }

  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  })
}

export async function unsubscribeBrowserPush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return null

  const success = await subscription.unsubscribe()
  if (!success) return subscription
  return null
}
