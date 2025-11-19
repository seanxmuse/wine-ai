-- Chat Conversations and Messages Tables
-- Run this in your Supabase SQL Editor

-- Chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wine_id UUID REFERENCES public.wine_results(id) ON DELETE SET NULL,
  scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
  image_url TEXT, -- Reference to wine list image
  title TEXT, -- Auto-generated from first message or wine name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Chat conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.chat_conversations;
CREATE POLICY "Users can insert own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;
CREATE POLICY "Users can update own conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chat_conversations;
CREATE POLICY "Users can delete own conversations"
  ON public.chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT, -- For image references in messages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies (accessible through conversation ownership)
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages from own conversations"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON public.chat_messages;
CREATE POLICY "Users can insert messages to own conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update messages from own conversations" ON public.chat_messages;
CREATE POLICY "Users can update messages from own conversations"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete messages from own conversations" ON public.chat_messages;
CREATE POLICY "Users can delete messages from own conversations"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS chat_conversations_wine_id_idx ON public.chat_conversations(wine_id);
CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx ON public.chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);

-- Trigger to update conversation updated_at when message is added
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message ON public.chat_messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_updated_at();


