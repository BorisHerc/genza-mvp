/**
 * GENZA — send-notification-email
 *
 * Sends Croatian transactional emails via Resend when in-app notifications are created.
 * Types: new_message, new_offer, offer_accepted, task_completed, review_received
 *
 * Deploy: supabase functions deploy send-notification-email
 *
 * Secrets:
 * - RESEND_API_KEY
 * - RESEND_FROM_EMAIL (e.g. Genza <notifications@yourdomain.com>)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { emailAlreadySent, logEmailSent } from '../_shared/email/dedup.ts'
import { resolveRecipientEmail } from '../_shared/email/recipient.ts'
import { sendResendEmail } from '../_shared/email/resend-client.ts'
import { buildCroatianNotificationEmail } from '../_shared/email/templates.ts'
import type { EmailNotificationType, NotificationEmailPayload } from '../_shared/email/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ENABLED_EMAIL_TYPES = new Set<EmailNotificationType>([
  'new_message',
  'new_offer',
  'offer_accepted',
  'task_completed',
  'review_received',
])

const NOTIFICATION_LOOKBACK_MS = 2 * 60 * 1000

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseOptionalId(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const raw = (await req.json()) as NotificationEmailPayload
    const userId = raw.userId?.trim()
    const type = (raw.notificationType ?? raw.type)?.trim() as EmailNotificationType
    const title = raw.title?.trim() ?? ''
    const body = raw.body?.trim() ?? ''
    const actionUrl = raw.actionUrl?.trim()
    const taskId = parseOptionalId(raw.taskId)
    const offerId = parseOptionalId(raw.offerId)
    const chatId = parseOptionalId(raw.chatId)

    if (!userId) {
      return jsonResponse({ ok: false, error: 'userId required' }, 400)
    }

    if (!type || !ENABLED_EMAIL_TYPES.has(type)) {
      console.log('[Genza] send-notification-email skipped type', { userId, type: type ?? null })
      return jsonResponse({ ok: true, skipped: true, reason: 'type_not_enabled', sent: false })
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
    let notificationQuery = admin
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', lookbackIso)
      .order('created_at', { ascending: false })
      .limit(1)

    if (taskId != null) notificationQuery = notificationQuery.eq('task_id', taskId)
    if (offerId != null) notificationQuery = notificationQuery.eq('offer_id', offerId)
    if (chatId != null) notificationQuery = notificationQuery.eq('chat_id', chatId)

    const { data: recentNotification, error: notificationError } = await notificationQuery.maybeSingle()

    if (notificationError) {
      console.error('[Genza] send-notification-email notification check failed', notificationError.message)
      return jsonResponse({ ok: false, error: notificationError.message }, 500)
    }

    if (!recentNotification) {
      console.warn('[Genza] send-notification-email rejected — no recent notification', {
        userId,
        type,
        callerId: caller.id,
      })
      return jsonResponse({ ok: false, error: 'No matching notification' }, 403)
    }

    const isDuplicate = await emailAlreadySent(admin, {
      userId,
      type,
      taskId,
      offerId,
      chatId,
      body,
    })

    if (isDuplicate) {
      console.log('[Genza] send-notification-email skipped duplicate', { userId, type })
      return jsonResponse({ ok: true, skipped: true, reason: 'duplicate', sent: false })
    }

    const recipientEmail =
      raw.recipientEmail?.trim() || (await resolveRecipientEmail(admin, userId))
    if (!recipientEmail) {
      console.warn('[Genza] send-notification-email — no recipient email', { userId, type })
      return jsonResponse({ ok: true, skipped: true, reason: 'no_email', sent: false })
    }

    const template = buildCroatianNotificationEmail({ type, title, body, actionUrl })
    const sendResult = await sendResendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (!sendResult.sent) {
      console.warn('[Genza] send-notification-email delivery failed', {
        userId,
        type,
        recipientEmail,
        error: sendResult.error ?? null,
      })
      return jsonResponse({
        ok: false,
        sent: false,
        error: sendResult.error ?? 'Resend delivery failed',
      })
    }

    await logEmailSent(admin, {
      userId,
      type,
      recipientEmail,
      taskId,
      offerId,
      chatId,
      body,
      resendId: sendResult.resendId,
    })

    console.log('[Genza] send-notification-email delivered', {
      userId,
      type,
      recipientEmail,
      resendId: sendResult.resendId ?? null,
    })

    return jsonResponse({
      ok: true,
      sent: true,
      resendId: sendResult.resendId ?? null,
    })
  } catch (error) {
    console.error('[Genza] send-notification-email error', error)
    return jsonResponse({ ok: false, error: String(error), sent: false }, 500)
  }
})
