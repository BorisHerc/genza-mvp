-- Genza: allow anonymous users to browse and view public task pages
-- Run in Supabase Dashboard → SQL Editor after 015_profile_stats.sql

DROP POLICY IF EXISTS "Public can read browsable tasks" ON public.tasks;

CREATE POLICY "Public can read browsable tasks"
  ON public.tasks FOR SELECT TO anon, authenticated
  USING (status IN ('open', 'assigned', 'in_progress', 'completed'));
