-- Align marketplace person-reference columns with Supabase Auth (uuid)
-- Required when offers.tasker_id / chats.user_id were created as bigint.
-- Run in Supabase Dashboard → SQL Editor.

-- Offers.tasker_id → uuid (matches auth.uid() RLS policies)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'offers'
      AND column_name = 'tasker_id'
      AND udt_name <> 'uuid'
  ) THEN
    DELETE FROM public.offers;
    ALTER TABLE public.offers
      ALTER COLUMN tasker_id TYPE uuid USING NULL;
  END IF;
END $$;

-- Chats participants → uuid
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chats'
      AND column_name = 'user_id'
      AND udt_name <> 'uuid'
  ) THEN
    DELETE FROM public.messages;
    DELETE FROM public.chats;
    ALTER TABLE public.chats
      ALTER COLUMN user_id TYPE uuid USING NULL,
      ALTER COLUMN tasker_id TYPE uuid USING NULL;
  END IF;
END $$;

-- Messages.sender_id → uuid
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'sender_id'
      AND udt_name <> 'uuid'
  ) THEN
    DELETE FROM public.messages;
    ALTER TABLE public.messages
      ALTER COLUMN sender_id TYPE uuid USING NULL;
  END IF;
END $$;
