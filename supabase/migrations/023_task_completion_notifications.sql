-- Task completion + review reminder notification types; optional link and read_at columns

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_offer',
    'offer_accepted',
    'new_message',
    'review_received',
    'nearby_task',
    'task_completed',
    'review_needed'
  ));

CREATE INDEX IF NOT EXISTS idx_notifications_dedup
  ON public.notifications (user_id, type, task_id, offer_id, chat_id);
