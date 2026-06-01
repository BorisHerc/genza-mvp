-- Multi-currency support: BAM (default for BiH) and EUR (EU)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BAM'
  CHECK (currency IN ('BAM', 'EUR'));

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BAM'
  CHECK (currency IN ('BAM', 'EUR'));

COMMENT ON COLUMN public.profiles.currency IS 'User display currency preference (BAM or EUR)';
COMMENT ON COLUMN public.tasks.currency IS 'Currency for task budget and offers';
