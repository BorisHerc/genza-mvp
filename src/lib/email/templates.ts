import type { EmailNotificationKind } from './types'

export function buildEmailMessage(input: {
  kind: EmailNotificationKind
  recipientName?: string
  title: string
  body: string
  actionUrl?: string
}): { subject: string; html: string; text: string } {
  const greeting = input.recipientName?.trim()
    ? `Hi ${input.recipientName},`
    : 'Hi,'

  const text = [greeting, '', input.title, input.body, input.actionUrl ? `\n${input.actionUrl}` : '']
    .filter(Boolean)
    .join('\n')

  const html = `
    <p>${greeting}</p>
    <p><strong>${escapeHtml(input.title)}</strong></p>
    <p>${escapeHtml(input.body)}</p>
    ${input.actionUrl ? `<p><a href="${escapeHtml(input.actionUrl)}">Open in Genza</a></p>` : ''}
  `.trim()

  return {
    subject: input.title,
    html,
    text,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
