-- Genza: add cancelled task status to lifecycle
-- Run in Supabase Dashboard → SQL Editor after 016_public_tasks.sql

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled'));

DROP POLICY IF EXISTS "Public can read browsable tasks" ON public.tasks;
CREATE POLICY "Public can read browsable tasks"
  ON public.tasks FOR SELECT TO anon, authenticated
  USING (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled'));
