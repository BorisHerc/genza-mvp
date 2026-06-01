-- Allow review_received notifications when a task participant leaves a review
-- Run in Supabase Dashboard → SQL Editor after 008_task_status_completed.sql

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_offer', 'offer_accepted', 'new_message', 'review_received'));
