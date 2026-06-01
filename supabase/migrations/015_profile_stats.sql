-- Genza: profile stats helper for ratings and completed work counts
-- Run in Supabase Dashboard → SQL Editor after 014_usernames.sql

CREATE OR REPLACE FUNCTION public.get_profile_stats(p_user_id uuid)
RETURNS TABLE (
  completed_jobs_count bigint,
  average_rating numeric,
  reviews_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT COUNT(*)
      FROM public.tasks t
      WHERE t.assigned_tasker_id = p_user_id
        AND t.status = 'completed'
    ) AS completed_jobs_count,
    COALESCE(
      (
        SELECT AVG(r.rating)::numeric
        FROM public.reviews r
        WHERE r.reviewed_user_id = p_user_id
      ),
      0
    ) AS average_rating,
    (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.reviewed_user_id = p_user_id
    ) AS reviews_count;
$$;

REVOKE ALL ON FUNCTION public.get_profile_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO anon, authenticated;
