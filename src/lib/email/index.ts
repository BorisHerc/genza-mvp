import { supabase } from '../supabase'
import { WebhookEmailProvider } from './resend-provider'
import { buildEmailMessage } from './templates'
import type { EmailNotificationKind, EmailProvider } from './types'

let cachedProvider: EmailProvider | null | undefined

function resolveEmailProvider(): EmailProvider | null {
  if (cachedProvider !== undefined) return cachedProvider

  const webhookUrl = import.meta.env.VITE_EMAIL_WEBHOOK_URL?.trim()
  if (webhookUrl) {
    cachedProvider = new WebhookEmailProvider(webhookUrl)
    return cachedProvider
  }

  cachedProvider = null
  return null
}

async function lookupRecipientEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_email')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.notification_email?.trim()) return null
  return data.notification_email.trim()
}

export async function trySendEmailNotification(input: {
  userId: string
  kind: EmailNotificationKind
  title: string
  body: string
  actionUrl?: string
  recipientName?: string
}) {
  const provider = resolveEmailProvider()
  if (!provider) {
    console.warn('[Genza] Email provider not configured — skipping email', {
      kind: input.kind,
      userId: input.userId,
      hint: 'Set VITE_EMAIL_WEBHOOK_URL for transactional email',
    })
    return { sent: false }
  }

  const to = await lookupRecipientEmail(input.userId)
  if (!to) {
    console.warn('[Genza] No notification email for user — skipping email', {
      kind: input.kind,
      userId: input.userId,
    })
    return { sent: false }
  }

  const template = buildEmailMessage({
    kind: input.kind,
    recipientName: input.recipientName,
    title: input.title,
    body: input.body,
    actionUrl: input.actionUrl,
  })

  const result = await provider.send({
    to,
    kind: input.kind,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })

  if (!result.sent) {
    console.warn('[Genza] Email send failed', {
      kind: input.kind,
      userId: input.userId,
      provider: provider.name,
      error: result.error,
    })
  }

  return result
}
