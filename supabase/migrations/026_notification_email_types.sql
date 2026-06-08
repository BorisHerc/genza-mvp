-- Extend notification_email_log for task_completed and review_received emails

ALTER TABLE public.notification_email_log DROP CONSTRAINT IF EXISTS notification_email_log_type_check;

ALTER TABLE public.notification_email_log
  ADD CONSTRAINT notification_email_log_type_check
  CHECK (type IN (
    'new_offer',
    'offer_accepted',
    'new_message',
    'nearby_task',
    'task_completed',
    'review_received'
  ));
