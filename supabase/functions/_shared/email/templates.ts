import type { EmailNotificationType } from './types.ts'

const CTA_BY_TYPE: Partial<Record<EmailNotificationType, string>> = {
  new_offer: 'Pogledaj ponudu',
  offer_accepted: 'Otvori razgovor',
  new_message: 'Odgovori u chatu',
  nearby_task: 'Pogledaj posao',
  task_completed: 'Pogledaj posao',
  review_received: 'Pogledaj recenziju',
}

function getCtaLabel(type: EmailNotificationType): string {
  return CTA_BY_TYPE[type] ?? 'Otvori u Genzi'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildCroatianNotificationEmail(input: {
  type: EmailNotificationType
  title: string
  body: string
  actionUrl?: string
}): { subject: string; html: string; text: string } {
  const subject = input.title.trim() || 'Genza obavijest'
  const body = input.body.trim()
  const ctaLabel = getCtaLabel(input.type)
  const actionUrl = input.actionUrl?.trim()

  const text = [
    'Pozdrav,',
    '',
    subject,
    body,
    '',
    actionUrl ? `${ctaLabel}: ${actionUrl}` : '',
    '',
    '— Genza',
  ]
    .filter((line, index, arr) => line !== '' || (index > 0 && arr[index - 1] !== ''))
    .join('\n')
    .trim()

  const buttonHtml = actionUrl
    ? `<p style="margin:28px 0 0;">
        <a href="${escapeHtml(actionUrl)}"
           style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:15px;">
          ${escapeHtml(ctaLabel)}
        </a>
       </p>
       <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
         <a href="${escapeHtml(actionUrl)}" style="color:#16a34a;">${escapeHtml(actionUrl)}</a>
       </p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="hr">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 8px;">
                <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#16a34a;">Genza</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">${escapeHtml(subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 28px;">
                <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#374151;">Pozdrav,</p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(body)}</p>
                ${buttonHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6;background:#fafafa;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">
                  Primili ste ovu poruku jer imate uključene obavijesti na Genzi.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}
