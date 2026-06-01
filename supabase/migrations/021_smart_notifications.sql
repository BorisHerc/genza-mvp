-- Tasker service categories, activity tracking, nearby task notifications

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_service_categories
  ON public.profiles USING GIN (service_categories);

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at
  ON public.profiles (last_seen_at DESC);

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_offer',
    'offer_accepted',
    'new_message',
    'review_received',
    'nearby_task'
  ));
