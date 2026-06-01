-- Genza: reliable messages RLS for both chat participants (owner + tasker)
-- Run in Supabase Dashboard → SQL Editor after 006_accept_offer_rls.sql

CREATE OR REPLACE FUNCTION public.auth_user_is_chat_participant(p_chat_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chats
    WHERE id = p_chat_id
      AND (user_id = auth.uid() OR tasker_id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_is_chat_participant(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_is_chat_participant(bigint) TO authenticated;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat participants can read messages" ON public.messages;
CREATE POLICY "Chat participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.auth_user_is_chat_participant(chat_id));

DROP POLICY IF EXISTS "Chat participants can send messages" ON public.messages;
CREATE POLICY "Chat participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.auth_user_is_chat_participant(chat_id)
  );
