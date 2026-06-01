-- Genza marketplace: offers, chat, notifications, task assignment
-- Run in Supabase Dashboard → SQL Editor
-- Profiles table: see 003_profiles.sql

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS accepted_offer_id uuid REFERENCES public.offers(id),
  ADD COLUMN IF NOT EXISTS assigned_tasker_id uuid;

ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.offers(id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_offer', 'offer_accepted', 'new_message')),
  title text NOT NULL,
  body text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE,
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_task_id ON public.offers(task_id);
CREATE INDEX IF NOT EXISTS idx_offers_tasker_id ON public.offers(tasker_id);
CREATE INDEX IF NOT EXISTS idx_chats_task_id ON public.chats(task_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_tasker_id ON public.chats(tasker_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Tasks policies (extend if missing)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read tasks" ON public.tasks;
CREATE POLICY "Authenticated users can read tasks"
  ON public.tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update own tasks" ON public.tasks;
CREATE POLICY "Owners can update own tasks"
  ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Offers policies
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read offers" ON public.offers;
CREATE POLICY "Authenticated users can read offers"
  ON public.offers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Taskers can create offers" ON public.offers;
CREATE POLICY "Taskers can create offers"
  ON public.offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = tasker_id);

DROP POLICY IF EXISTS "Taskers can update own offers" ON public.offers;
CREATE POLICY "Taskers can update own offers"
  ON public.offers FOR UPDATE TO authenticated USING (auth.uid() = tasker_id);

DROP POLICY IF EXISTS "Task owners can update offers on their tasks" ON public.offers;
CREATE POLICY "Task owners can update offers on their tasks"
  ON public.offers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = offers.task_id AND tasks.user_id = auth.uid()
    )
  );

-- Chats policies
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read chats" ON public.chats;
CREATE POLICY "Participants can read chats"
  ON public.chats FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = tasker_id);

DROP POLICY IF EXISTS "Participants can create chats" ON public.chats;
CREATE POLICY "Participants can create chats"
  ON public.chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR auth.uid() = tasker_id);

-- Messages policies
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
