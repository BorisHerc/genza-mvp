-- Profile geolocation, neighborhood, tasker availability, starting prices, notification email

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS availability_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS starting_prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_email text;

CREATE INDEX IF NOT EXISTS idx_profiles_availability
  ON public.profiles (availability_enabled)
  WHERE availability_enabled = true;

CREATE INDEX IF NOT EXISTS idx_profiles_coords
  ON public.profiles (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
