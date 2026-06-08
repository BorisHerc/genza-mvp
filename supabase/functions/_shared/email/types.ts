export type EmailNotificationType =
  | 'new_offer'
  | 'offer_accepted'
  | 'new_message'
  | 'task_completed'
  | 'review_received'
  | 'nearby_task'

export interface NotificationEmailPayload {
  userId: string
  notificationType?: EmailNotificationType
  type?: EmailNotificationType
  title: string
  body: string
  actionUrl?: string
  recipientEmail?: string | null
  taskId?: number | null
  offerId?: number | null
  chatId?: number | null
}

export interface ResendSendInput {
  to: string
  subject: string
  html: string
  text: string
}

export interface ResendSendResult {
  sent: boolean
  resendId?: string
  error?: string
}
