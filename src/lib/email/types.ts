export type EmailNotificationKind =
  | 'new_offer'
  | 'offer_accepted'
  | 'new_message'
  | 'task_completed'
  | 'review_received'

export const EMAIL_NOTIFICATION_TYPES = new Set<EmailNotificationKind>([
  'new_offer',
  'offer_accepted',
  'new_message',
  'task_completed',
  'review_received',
])

export function isEmailNotificationType(type: string): type is EmailNotificationKind {
  return EMAIL_NOTIFICATION_TYPES.has(type as EmailNotificationKind)
}
