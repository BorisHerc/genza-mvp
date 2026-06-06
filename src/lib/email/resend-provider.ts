import type { EmailMessage, EmailProvider, EmailSendResult } from './types'

/**
 * Future Resend integration — expects a server-side webhook that holds the API key.
 * Set VITE_EMAIL_WEBHOOK_URL to your Supabase Edge Function or API route.
 */
export class WebhookEmailProvider implements EmailProvider {
  readonly name = 'webhook'
  private webhookUrl: string

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'resend',
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          kind: message.kind,
        }),
      })

      if (!response.ok) {
        return { sent: false, error: `Webhook returned ${response.status}` }
      }

      return { sent: true }
    } catch (error) {
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Email webhook failed',
      }
    }
  }
}
