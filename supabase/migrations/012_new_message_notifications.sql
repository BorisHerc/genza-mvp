-- Genza: ensure new_message notifications can be inserted for chat participants
-- Run in Supabase Dashboard → SQL Editor after 011_messages_chat_participant_rls.sql

-- ---------------------------------------------------------------------------
-- notifications.type CHECK (idempotent)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'notifications'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_offer', 'offer_accepted', 'new_message', 'review_received'));

-- ---------------------------------------------------------------------------
-- Helper: validate chat participants before cross-user notification insert
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_users_are_chat_participants(
  p_chat_id bigint,
  p_sender_id uuid,
  p_receiver_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_sender_id IS DISTINCT FROM p_receiver_id
    AND EXISTS (
      SELECT 1
      FROM public.chats
      WHERE id = p_chat_id
        AND (
          (user_id = p_sender_id AND tasker_id = p_receiver_id)
          OR (user_id = p_receiver_id AND tasker_id = p_sender_id)
        )
    );
$$;

REVOKE ALL ON FUNCTION public.auth_users_are_chat_participants(bigint, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_users_are_chat_participants(bigint, uuid, uuid) TO authenticated;

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
      WITH CHECK (type <> 'new_message');

    DROP POLICY IF EXISTS "Chat participants can create message notifications" ON public.notifications;
    CREATE POLICY "Chat participants can create message notifications"
      ON public.notifications FOR INSERT TO authenticated
      WITH CHECK (
        type = 'new_message'
        AND auth.uid() IS DISTINCT FROM user_id
        AND chat_id IS NOT NULL
        AND public.auth_users_are_chat_participants(chat_id, auth.uid(), user_id)
      );
  END IF;
END $$;
