import type { NotificationType } from '../../types/marketplace'
import { supabase } from '../supabase'

/** Phase 1 — expand as edge function delivery is verified for more types. */
const PUSH_DELIVERY_TYPES = new Set<NotificationType>(['new_offer', 'new_message'])

export interface PushDeliveryPayload {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
}

function buildAbsoluteUrl(link?: string): string | undefined {
  if (!link || typeof window === 'undefined') return undefined
  if (link.startsWith('http')) return link
  return `${window.location.origin}${link.startsWith('/') ? link : `/${link}`}`
}

/**
 * Sends web push via Supabase Edge Function after an in-app notification row is created.
 * Fails silently if the function is unavailable or the user has no subscriptions.
 */
export async function preparePushDelivery(payload: PushDeliveryPayload): Promise<void> {
  if (!PUSH_DELIVERY_TYPES.has(payload.type)) return

  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        url: buildAbsoluteUrl(payload.link) ?? buildAbsoluteUrl('/notifications'),
        tag: `genza-${payload.type}`,
      },
    })

    if (error) {
      console.warn('[Genza] push delivery failed', {
        userId: payload.userId,
        type: payload.type,
        message: error.message,
      })
      return
    }

    const result = data as { delivered?: number; failed?: number; skipped?: boolean } | null
    const delivered = result?.delivered ?? 0

    if (result?.skipped) {
      console.log('[Genza] push delivery skipped', { userId: payload.userId, type: payload.type })
      return
    }

    console.log('[Genza] push delivery complete', {
      userId: payload.userId,
      type: payload.type,
      delivered,
      failed: result?.failed ?? 0,
    })
  } catch (error) {
    console.warn('[Genza] push delivery failed', {
      userId: payload.userId,
      type: payload.type,
      error,
    })
  }
}
