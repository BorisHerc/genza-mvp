-- Dual-role marketplace: add `user` system role; keep client/tasker for legacy demo rows.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('client', 'tasker', 'user', 'admin'));

COMMENT ON COLUMN public.profiles.role IS 'Legacy + system role: user (default), admin, or legacy client/tasker demo values';

-- Public reviews for all marketplace profiles (not admin-only gate on tasker role).
DROP POLICY IF EXISTS "Public can read tasker reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can read profile reviews" ON public.reviews;

CREATE POLICY "Public can read profile reviews"
  ON public.reviews FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = reviews.reviewed_user_id
        AND (p.role IS NULL OR p.role IN ('client', 'tasker', 'user'))
    )
  );
