export type EmailNotificationKind =
  | 'new_offer'
  | 'offer_accepted'
  | 'new_message'
  | 'nearby_task'

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  kind: EmailNotificationKind
}

export interface EmailSendResult {
  sent: boolean
  error?: string
}

export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage): Promise<EmailSendResult>
}
