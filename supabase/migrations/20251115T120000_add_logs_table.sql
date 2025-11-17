-- Add logs table for production debugging
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  category TEXT NOT NULL, -- e.g., 'UPLOAD', 'PARSE', 'MATCH', 'FETCH'
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_category ON public.logs(category);

-- Enable Row Level Security
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Logs policies
DROP POLICY IF EXISTS "Users can view own logs" ON public.logs;
CREATE POLICY "Users can view own logs"
  ON public.logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own logs" ON public.logs;
CREATE POLICY "Users can insert own logs"
  ON public.logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous logs (for unauthenticated debugging)
DROP POLICY IF EXISTS "Anyone can insert anonymous logs" ON public.logs;
CREATE POLICY "Anyone can insert anonymous logs"
  ON public.logs FOR INSERT
  WITH CHECK (user_id IS NULL);
