-- Genza: admin panel + moderation foundation
-- Run in Supabase Dashboard → SQL Editor after 017_task_cancelled.sql

-- ---------------------------------------------------------------------------
-- Admin role, suspension, hidden tasks
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('client', 'tasker', 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tasks_is_hidden ON public.tasks (is_hidden);

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reports (
  id bigserial PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_id bigint REFERENCES public.tasks(id) ON DELETE SET NULL,
  chat_id bigint REFERENCES public.chats(id) ON DELETE SET NULL,
  message_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_has_target CHECK (
    reported_user_id IS NOT NULL OR task_id IS NOT NULL OR chat_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_chat_id ON public.reports(chat_id);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_user_is_suspended()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND suspended_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_user_is_suspended() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_is_suspended() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  location text,
  created_at timestamptz,
  verified boolean,
  suspended_at timestamptz,
  completed_jobs_count bigint,
  average_rating numeric,
  reviews_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.auth_user_is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.full_name,
    p.role,
    p.location,
    p.created_at,
    p.verified,
    p.suspended_at,
    stats.completed_jobs_count,
    stats.average_rating,
    stats.reviews_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL public.get_profile_stats(p.id) stats ON true
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: reports
-- ---------------------------------------------------------------------------

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND NOT public.auth_user_is_suspended()
  );

DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
CREATE POLICY "Users can read own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all reports" ON public.reports;
CREATE POLICY "Admins can read all reports"
  ON public.reports FOR SELECT TO authenticated
  USING (public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.auth_user_is_admin())
  WITH CHECK (public.auth_user_is_admin());

-- ---------------------------------------------------------------------------
-- RLS: admin moderation on profiles + tasks
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can moderate profiles" ON public.profiles;
CREATE POLICY "Admins can moderate profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.auth_user_is_admin())
  WITH CHECK (public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can moderate tasks" ON public.tasks;
CREATE POLICY "Admins can moderate tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.auth_user_is_admin())
  WITH CHECK (public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can read messages for moderation" ON public.messages;
CREATE POLICY "Admins can read messages for moderation"
  ON public.messages FOR SELECT TO authenticated
  USING (public.auth_user_is_admin());

-- Block suspended users from creating offers/messages (restrictive = AND with permissive policies)
DROP POLICY IF EXISTS "Suspended users cannot insert offers" ON public.offers;
CREATE POLICY "Suspended users cannot insert offers"
  ON public.offers AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.auth_user_is_suspended());

DROP POLICY IF EXISTS "Suspended users cannot send messages" ON public.messages;
CREATE POLICY "Suspended users cannot send messages"
  ON public.messages AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.auth_user_is_suspended());

-- ---------------------------------------------------------------------------
-- Public task visibility excludes hidden tasks
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read browsable tasks" ON public.tasks;
CREATE POLICY "Public can read browsable tasks"
  ON public.tasks FOR SELECT TO anon, authenticated
  USING (
    is_hidden IS NOT TRUE
    AND status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')
  );

DROP POLICY IF EXISTS "Public can read completed tasks" ON public.tasks;
CREATE POLICY "Public can read completed tasks"
  ON public.tasks FOR SELECT TO anon, authenticated
  USING (status = 'completed' AND is_hidden IS NOT TRUE);
