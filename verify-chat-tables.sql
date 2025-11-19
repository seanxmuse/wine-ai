-- Verification queries to check if chat tables were created successfully
-- Run these in Supabase SQL Editor to verify

-- Check if chat_conversations table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('chat_conversations', 'chat_messages')
ORDER BY table_name;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('chat_conversations', 'chat_messages');

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('chat_conversations', 'chat_messages')
ORDER BY tablename, policyname;

-- Check indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('chat_conversations', 'chat_messages')
ORDER BY tablename, indexname;

