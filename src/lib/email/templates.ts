import type { EmailNotificationKind } from './types'

/** Croatian CTA labels — HTML is built server-side in the edge function. */
export const EMAIL_CTA_BY_KIND: Record<EmailNotificationKind, string> = {
  new_offer: 'Pogledaj ponudu',
  offer_accepted: 'Otvori razgovor',
  new_message: 'Odgovori u chatu',
  task_completed: 'Pogledaj posao',
  review_received: 'Pogledaj recenziju',
}
