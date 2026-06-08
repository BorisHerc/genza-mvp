import type { ResendSendInput, ResendSendResult } from './types.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'

/**
 * Reusable Resend sender — reads RESEND_API_KEY and RESEND_FROM_EMAIL from env.
 */
export async function sendResendEmail(input: ResendSendInput): Promise<ResendSendResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  const from = Deno.env.get('RESEND_FROM_EMAIL')?.trim() ?? 'Genza <onboarding@resend.dev>'

  if (!apiKey) {
    return { sent: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    })

    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string }

    if (!response.ok) {
      return {
        sent: false,
        error: payload.message ?? `Resend HTTP ${response.status}`,
      }
    }

    return { sent: true, resendId: payload.id }
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Resend request failed',
    }
  }
}
