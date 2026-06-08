-- Tracks sent notification emails for deduplication and delivery auditing

CREATE TABLE IF NOT EXISTS public.notification_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_offer', 'offer_accepted', 'new_message', 'nearby_task')),
  task_id bigint,
  offer_id bigint,
  chat_id bigint,
  body_preview text,
  recipient_email text NOT NULL,
  resend_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_email_log_user_type
  ON public.notification_email_log (user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_email_log_dedup
  ON public.notification_email_log (user_id, type, task_id, offer_id, chat_id, created_at DESC);

ALTER TABLE public.notification_email_log ENABLE ROW LEVEL SECURITY;

-- Service role only (edge functions) — no client access
DROP POLICY IF EXISTS "Service role manages email log" ON public.notification_email_log;
