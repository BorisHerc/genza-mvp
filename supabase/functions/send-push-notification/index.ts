/**
 * GENZA — send-push-notification
 *
 * Delivers web push to rows in push_subscriptions via VAPID.
 * Phase 1 types: new_message, new_offer
 *
 * Deploy: supabase functions deploy send-push-notification --no-verify-jwt
 * (Client invokes with user JWT; function validates auth + recent notification row.)
 *
 * Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, optional VAPID_SUBJECT
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ENABLED_PUSH_TYPES = new Set(['new_message', 'new_offer'])
const NOTIFICATION_LOOKBACK_MS = 2 * 60 * 1000

interface PushRequestBody {
  userId?: string
  type?: string
  title?: string
  body?: string
  url?: string
  tag?: string
}

interface PushSubscriptionKeys {
  p256dh?: string
  auth?: string
}

interface PushSubscriptionRow {
  id: string
  endpoint: string
  keys: PushSubscriptionKeys
}

interface WebPushError extends Error {
  statusCode?: number
  body?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isWebPushError(error: unknown): error is WebPushError {
  return error instanceof Error && 'statusCode' in error
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as PushRequestBody
    const userId = payload.userId?.trim()
    const type = payload.type?.trim()

    if (!userId) {
      return jsonResponse({ ok: false, error: 'userId required' }, 400)
    }

    if (!type || !ENABLED_PUSH_TYPES.has(type)) {
      console.log('[Genza] send-push-notification skipped type', { userId, type: type ?? null })
      return jsonResponse({ ok: true, skipped: true, reason: 'type_not_enabled', delivered: 0 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ ok: false, error: 'Supabase env missing' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ ok: false, error: 'Authorization required' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: caller },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !caller) {
      return jsonResponse({ ok: false, error: 'Invalid session' }, 401)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const lookbackIso = new Date(Date.now() - NOTIFICATION_LOOKBACK_MS).toISOString()
    const { data: recentNotification, error: notificationError } = await admin
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', lookbackIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (notificationError) {
      console.error('[Genza] send-push-notification notification check failed', notificationError.message)
      return jsonResponse({ ok: false, error: notificationError.message }, 500)
    }

    if (!recentNotification) {
      console.warn('[Genza] send-push-notification rejected — no recent notification', {
        userId,
        type,
        callerId: caller.id,
      })
      return jsonResponse({ ok: false, error: 'No matching notification' }, 403)
    }

    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:notifications@genza.app'

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.warn('[Genza] send-push-notification — VAPID keys not configured', { userId, type })
      return jsonResponse(
        {
          ok: false,
          error: 'VAPID keys not configured',
          delivered: 0,
        },
        503,
      )
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, keys')
      .eq('user_id', userId)

    if (subscriptionsError) {
      console.error('[Genza] send-push-notification query failed', subscriptionsError.message)
      return jsonResponse({ ok: false, error: subscriptionsError.message }, 500)
    }

    const rows = (subscriptions ?? []) as PushSubscriptionRow[]
    if (!rows.length) {
      console.log('[Genza] send-push-notification — no subscriptions', { userId, type })
      return jsonResponse({ ok: true, delivered: 0, failed: 0, removed: 0, subscriptionCount: 0 })
    }

    const pushPayload = JSON.stringify({
      title: payload.title?.trim() || 'Genza',
      body: payload.body?.trim() || '',
      url: payload.url?.trim() || '/notifications',
      tag: payload.tag?.trim() || `genza-${type}`,
    })

    let delivered = 0
    let failed = 0
    let removed = 0

    for (const row of rows) {
      const p256dh = row.keys?.p256dh
      const auth = row.keys?.auth

      if (!row.endpoint || !p256dh || !auth) {
        failed += 1
        console.warn('[Genza] send-push-notification invalid subscription keys', { id: row.id })
        continue
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh, auth },
          },
          pushPayload,
          { TTL: 60 * 60 * 24 },
        )
        delivered += 1
      } catch (error) {
        const statusCode = isWebPushError(error) ? error.statusCode : undefined

        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await admin.from('push_subscriptions').delete().eq('id', row.id)
          if (deleteError) {
            console.warn('[Genza] send-push-notification stale sub delete failed', {
              id: row.id,
              message: deleteError.message,
            })
          } else {
            removed += 1
          }
          continue
        }

        failed += 1
        console.warn('[Genza] send-push-notification send failed', {
          id: row.id,
          userId,
          type,
          statusCode: statusCode ?? null,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    console.log('[Genza] send-push-notification complete', {
      userId,
      type,
      delivered,
      failed,
      removed,
      subscriptionCount: rows.length,
    })

    return jsonResponse({
      ok: true,
      delivered,
      failed,
      removed,
      subscriptionCount: rows.length,
    })
  } catch (error) {
    console.error('[Genza] send-push-notification error', error)
    return jsonResponse({ ok: false, error: String(error) }, 500)
  }
})
