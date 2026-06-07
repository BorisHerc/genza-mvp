import type { NotificationType } from '../../types/marketplace'
import { supabase } from '../supabase'

const PUSH_DELIVERY_TYPES = new Set<NotificationType>([
  'new_offer',
  'offer_accepted',
  'new_message',
  'nearby_task',
  'review_received',
  'task_completed',
])

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
 * Requests push delivery for a user after an in-app notification row is created.
 * Invokes the Supabase Edge Function placeholder — fails silently if unavailable.
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
      console.warn('[Genza] push delivery preparation failed', {
        userId: payload.userId,
        type: payload.type,
        message: error.message,
      })
      return
    }

    console.log('[Genza] push delivery prepared', {
      userId: payload.userId,
      type: payload.type,
      result: data ?? null,
    })
  } catch (error) {
    console.warn('[Genza] push delivery preparation failed', {
      userId: payload.userId,
      type: payload.type,
      error,
    })
  }
}
