import type { PushSubscriptionKeys, PushSubscriptionRow } from '../../types/database'
import { getSupabaseErrorMessage } from '../errors'
import { supabase } from '../supabase'
import { getPushSupportStatus } from './capabilities'
import {
  getServiceWorkerRegistration,
  subscribeBrowserPush,
  unsubscribeBrowserPush,
} from './register'

function extractSubscriptionKeys(subscription: PushSubscription): PushSubscriptionKeys | null {
  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth

  if (!p256dh || !auth) return null
  return { p256dh, auth }
}

export async function listPushSubscriptions(userId: string) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { subscriptions: [] as PushSubscriptionRow[], error: getSupabaseErrorMessage(error) }
  }

  return { subscriptions: (data ?? []) as PushSubscriptionRow[], error: undefined }
}

export async function savePushSubscription(userId: string, subscription: PushSubscription) {
  const keys = extractSubscriptionKeys(subscription)
  if (!keys) {
    return { success: false, error: 'Invalid push subscription keys.' }
  }

  const payload = {
    user_id: userId,
    endpoint: subscription.endpoint,
    keys,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  }

  const { error } = await supabase.from('push_subscriptions').upsert(payload, {
    onConflict: 'user_id,endpoint',
  })

  if (error) {
    console.warn('[Genza] push subscription save failed', error.message)
    return { success: false, error: getSupabaseErrorMessage(error) }
  }

  console.log('[Genza] push subscription saved', { userId, endpoint: subscription.endpoint })
  return { success: true, error: undefined }
}

export async function removePushSubscription(userId: string, endpoint: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) {
    console.warn('[Genza] push subscription remove failed', error.message)
    return { success: false, error: getSupabaseErrorMessage(error) }
  }

  return { success: true, error: undefined }
}

export async function removeAllPushSubscriptions(userId: string) {
  const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', userId)

  if (error) {
    return { success: false, error: getSupabaseErrorMessage(error) }
  }

  return { success: true, error: undefined }
}

export async function getPushStatusForUser(userId: string | undefined) {
  if (!userId) {
    return { status: getPushSupportStatus(false), subscriptionCount: 0, error: undefined }
  }

  const { subscriptions, error } = await listPushSubscriptions(userId)
  const hasActive = subscriptions.length > 0

  return {
    status: getPushSupportStatus(hasActive),
    subscriptionCount: subscriptions.length,
    error,
  }
}

export async function enablePushNotifications(userId: string) {
  const registration = await getServiceWorkerRegistration()
  if (!registration) {
    return { success: false, error: 'Service worker unavailable.' }
  }

  const subscription = await subscribeBrowserPush(registration)
  if (!subscription) {
    return { success: false, error: 'Push permission denied or unavailable.' }
  }

  return savePushSubscription(userId, subscription)
}

export async function disablePushNotifications(userId: string) {
  const registration = await getServiceWorkerRegistration()
  if (registration) {
    const subscription = await unsubscribeBrowserPush(registration)
    if (subscription?.endpoint) {
      await removePushSubscription(userId, subscription.endpoint)
    }
  }

  await removeAllPushSubscriptions(userId)
  return { success: true, error: undefined }
}
