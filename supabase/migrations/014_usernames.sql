-- Genza: unique slug-safe usernames for public profile URLs
-- Run in Supabase Dashboard → SQL Editor after 013_profiles_public.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_check
  CHECK (
    username IS NULL
    OR username ~ '^[a-z0-9_]{3,30}$'
  );

DROP INDEX IF EXISTS idx_profiles_username_unique;
CREATE UNIQUE INDEX idx_profiles_username_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Backfill temporary usernames for existing profiles
UPDATE public.profiles
SET username = 'user_' || substr(replace(id::text, '-', ''), 1, 8)
WHERE username IS NULL;
