-- Genza reviews: align with Supabase Auth + RLS for post-completion reviews
-- Run in Supabase Dashboard → SQL Editor after 006_accept_offer_rls.sql

CREATE OR REPLACE FUNCTION public.can_review_task(p_task_id bigint, p_reviewee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = p_task_id
      AND t.status = 'completed'
      AND (
        (t.user_id = auth.uid() AND t.assigned_tasker_id = p_reviewee_id)
        OR (t.assigned_tasker_id = auth.uid() AND t.user_id = p_reviewee_id)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_review_task(bigint, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_review_task(bigint, uuid) TO authenticated;

-- Align legacy bigint user columns with auth uuid
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews'
      AND column_name = 'reviewer_id' AND udt_name <> 'uuid'
  ) THEN
    DELETE FROM public.reviews;
    ALTER TABLE public.reviews
      ALTER COLUMN reviewer_id TYPE uuid USING NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews'
      AND column_name = 'reviewed_user_id' AND udt_name <> 'uuid'
  ) THEN
    ALTER TABLE public.reviews
      ALTER COLUMN reviewed_user_id TYPE uuid USING NULL;
  END IF;
END $$;

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment text;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_task_id_reviewer_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_task_reviewer
  ON public.reviews (task_id, reviewer_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read relevant reviews" ON public.reviews;
CREATE POLICY "Users can read relevant reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR reviewed_user_id = auth.uid()
    OR public.auth_user_owns_task(task_id)
    OR public.auth_user_is_assigned_tasker(task_id)
  );

DROP POLICY IF EXISTS "Participants can submit reviews" ON public.reviews;
CREATE POLICY "Participants can submit reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND public.can_review_task(task_id, reviewed_user_id)
  );

DROP POLICY IF EXISTS "Reviewers can update own reviews" ON public.reviews;
CREATE POLICY "Reviewers can update own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());
