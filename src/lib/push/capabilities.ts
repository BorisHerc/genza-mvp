export type PushSupportStatus =
  | 'unsupported'
  | 'ios_install_required'
  | 'permission_denied'
  | 'ready'
  | 'subscribed'

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua)
  const isIpadOs =
    navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1

  return isAppleMobile || isIpadOs
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error legacy iOS Safari standalone flag
    window.navigator.standalone === true
  )
}

export function hasBasicPushApis(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!hasBasicPushApis()) return 'unsupported'
  return Notification.permission
}

export function getVapidPublicKey(): string | null {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim()
  return key || null
}

export function isPushConfigured(): boolean {
  return Boolean(getVapidPublicKey())
}

export function getPushSupportStatus(hasActiveSubscription: boolean): PushSupportStatus {
  if (!hasBasicPushApis()) return 'unsupported'
  if (!isPushConfigured()) return 'unsupported'

  if (isIosDevice() && !isStandalonePwa()) {
    return 'ios_install_required'
  }

  const permission = Notification.permission
  if (permission === 'denied') return 'permission_denied'
  if (hasActiveSubscription && permission === 'granted') return 'subscribed'
  return 'ready'
}
