/**
 * GENZA — send-push-notification (placeholder)
 *
 * Deploy: supabase functions deploy send-push-notification
 *
 * Required secrets (Supabase Dashboard → Edge Functions → Secrets):
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 * - SUPABASE_URL (auto-injected)
 *
 * Production implementation:
 * 1. Load push_subscriptions for body.userId using service role client
 * 2. Send each subscription via web-push (npm:web-push) with VAPID keys
 * 3. Delete expired subscriptions (410 Gone)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushRequestBody {
  userId?: string
  type?: string
  title?: string
  body?: string
  url?: string
  tag?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as PushRequestBody
    const userId = payload.userId?.trim()

    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: 'userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Supabase env missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { data: subscriptions, error } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, keys')
      .eq('user_id', userId)

    if (error) {
      console.error('[Genza] send-push-notification query failed', error.message)
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const count = subscriptions?.length ?? 0
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.warn('[Genza] send-push-notification placeholder — VAPID keys not configured', {
        userId,
        type: payload.type ?? null,
        subscriptionCount: count,
      })

      return new Response(
        JSON.stringify({
          ok: true,
          placeholder: true,
          delivered: 0,
          subscriptionCount: count,
          message: 'Configure VAPID keys and web-push to deliver notifications.',
        }),
        {
          status: 202,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // TODO: integrate web-push library and deliver to each subscription endpoint.
    console.log('[Genza] send-push-notification ready for delivery', {
      userId,
      type: payload.type ?? null,
      subscriptionCount: count,
      title: payload.title ?? null,
    })

    return new Response(
      JSON.stringify({
        ok: true,
        placeholder: true,
        delivered: 0,
        subscriptionCount: count,
        message: 'VAPID configured — wire web-push send loop here.',
      }),
      {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('[Genza] send-push-notification error', error)
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
