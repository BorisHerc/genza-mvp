-- Ensure tasks.status accepts the full Genza lifecycle including completed
-- Run in Supabase Dashboard → SQL Editor after 007_reviews.sql

UPDATE public.tasks
SET status = 'completed'
WHERE lower(trim(replace(status, ' ', '_'))) IN ('complete', 'done', 'finished', 'closed', 'resolved', 'archived');

UPDATE public.tasks
SET status = 'in_progress'
WHERE lower(trim(replace(status, ' ', '_'))) IN ('inprogress', 'in-progress');

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('open', 'assigned', 'in_progress', 'completed'));
