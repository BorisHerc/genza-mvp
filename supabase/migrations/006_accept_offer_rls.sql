-- Genza: fix accept-offer RLS + align FK column types with bigint task/offer ids
-- Run in Supabase Dashboard → SQL Editor after 005_offers_auth_uuid_columns.sql

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER avoids RLS subquery visibility issues)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_user_owns_task(p_task_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE id = p_task_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_user_is_assigned_tasker(p_task_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE id = p_task_id
      AND assigned_tasker_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_owns_task(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_user_is_assigned_tasker(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_owns_task(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_is_assigned_tasker(bigint) TO authenticated;

-- ---------------------------------------------------------------------------
-- Align assignment / FK columns with bigint offers.id + uuid auth users
-- ---------------------------------------------------------------------------

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_accepted_offer_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks'
      AND column_name = 'accepted_offer_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.tasks
      ALTER COLUMN accepted_offer_id TYPE bigint USING NULL;
  END IF;
END $$;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_accepted_offer_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_accepted_offer_id_fkey
  FOREIGN KEY (accepted_offer_id) REFERENCES public.offers(id) ON DELETE SET NULL;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_tasker_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assigned_tasker_id_fkey
  FOREIGN KEY (assigned_tasker_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_offer_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chats'
      AND column_name = 'offer_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.chats
      ALTER COLUMN offer_id TYPE bigint USING NULL;
  END IF;
END $$;

ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_offer_id_fkey;
ALTER TABLE public.chats
  ADD CONSTRAINT chats_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE SET NULL;

-- notifications FK columns (table may not exist yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_task_id_fkey;
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_offer_id_fkey;
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_chat_id_fkey;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications'
        AND column_name = 'task_id' AND udt_name = 'uuid'
    ) THEN
      ALTER TABLE public.notifications
        ALTER COLUMN task_id TYPE bigint USING NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications'
        AND column_name = 'offer_id' AND udt_name = 'uuid'
    ) THEN
      ALTER TABLE public.notifications
        ALTER COLUMN offer_id TYPE bigint USING NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications'
        AND column_name = 'chat_id' AND udt_name = 'uuid'
    ) THEN
      ALTER TABLE public.notifications
        ALTER COLUMN chat_id TYPE bigint USING NULL;
    END IF;

    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_task_id_fkey
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_offer_id_fkey
        FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;

    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_chat_id_fkey
        FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- tasks RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read tasks" ON public.tasks;
CREATE POLICY "Authenticated users can read tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update own tasks" ON public.tasks;
CREATE POLICY "Owners can update own tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Assigned taskers can update task progress" ON public.tasks;
CREATE POLICY "Assigned taskers can update task progress"
  ON public.tasks FOR UPDATE TO authenticated
  USING (assigned_tasker_id = auth.uid())
  WITH CHECK (assigned_tasker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- offers RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read offers" ON public.offers;
CREATE POLICY "Authenticated users can read offers"
  ON public.offers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Taskers can create offers" ON public.offers;
CREATE POLICY "Taskers can create offers"
  ON public.offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tasker_id);

DROP POLICY IF EXISTS "Taskers can update own offers" ON public.offers;
CREATE POLICY "Taskers can update own offers"
  ON public.offers FOR UPDATE TO authenticated
  USING (auth.uid() = tasker_id)
  WITH CHECK (auth.uid() = tasker_id);

DROP POLICY IF EXISTS "Task owners can update offers on their tasks" ON public.offers;
CREATE POLICY "Task owners can update offers on their tasks"
  ON public.offers FOR UPDATE TO authenticated
  USING (public.auth_user_owns_task(task_id))
  WITH CHECK (public.auth_user_owns_task(task_id));

-- ---------------------------------------------------------------------------
-- chats RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read chats" ON public.chats;
CREATE POLICY "Participants can read chats"
  ON public.chats FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = tasker_id);

DROP POLICY IF EXISTS "Participants can create chats" ON public.chats;
CREATE POLICY "Participants can create chats"
  ON public.chats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = tasker_id);

DROP POLICY IF EXISTS "Task owners can create chats for their tasks" ON public.chats;
CREATE POLICY "Task owners can create chats for their tasks"
  ON public.chats FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.auth_user_owns_task(task_id)
  );

-- ---------------------------------------------------------------------------
-- messages RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat participants can read messages" ON public.messages;
CREATE POLICY "Chat participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
        AND (chats.user_id = auth.uid() OR chats.tasker_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Chat participants can send messages" ON public.messages;
CREATE POLICY "Chat participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
        AND (chats.user_id = auth.uid() OR chats.tasker_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- notifications RLS
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
    CREATE POLICY "Users read own notifications"
      ON public.notifications FOR SELECT TO authenticated
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
    CREATE POLICY "Users update own notifications"
      ON public.notifications FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
    CREATE POLICY "Authenticated users can create notifications"
      ON public.notifications FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END $$;
