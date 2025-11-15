-- Wine Scanner App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Scans table (wine list scan history)
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  restaurant_name TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Scans policies
CREATE POLICY "Users can view own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
  ON public.scans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON public.scans FOR DELETE
  USING (auth.uid() = user_id);

-- Wine results table (parsed wines from scans)
CREATE TABLE IF NOT EXISTS public.wine_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE NOT NULL,
  lwin7 TEXT,
  lwin TEXT,
  display_name TEXT NOT NULL,
  vintage TEXT,
  restaurant_price DECIMAL(10, 2) NOT NULL,
  real_price DECIMAL(10, 2),
  markup DECIMAL(10, 2),
  critic_score DECIMAL(5, 2),
  critic_name TEXT,
  varietal TEXT,
  region TEXT,
  color TEXT,
  drinking_window TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.wine_results ENABLE ROW LEVEL SECURITY;

-- Wine results policies (accessible through scan ownership)
CREATE POLICY "Users can view wines from own scans"
  ON public.wine_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = wine_results.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert wines to own scans"
  ON public.wine_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = wine_results.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update wines from own scans"
  ON public.wine_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = wine_results.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete wines from own scans"
  ON public.wine_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = wine_results.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- Favorites table (saved wines)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wine_result_id UUID REFERENCES public.wine_results(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, wine_result_id)
);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON public.favorites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Wine Labs API cache table (reduce API calls)
CREATE TABLE IF NOT EXISTS public.wine_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lwin TEXT UNIQUE,
  lwin7 TEXT,
  display_name TEXT NOT NULL,
  varietal TEXT,
  color TEXT,
  region TEXT,
  country TEXT,
  median_price DECIMAL(10, 2),
  critic_score DECIMAL(5, 2),
  critic_name TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS wine_cache_lwin_idx ON public.wine_cache(lwin);
CREATE INDEX IF NOT EXISTS wine_cache_lwin7_idx ON public.wine_cache(lwin7);
CREATE INDEX IF NOT EXISTS wine_cache_display_name_idx ON public.wine_cache(display_name);

-- Wine cache is public read (no sensitive data)
ALTER TABLE public.wine_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wine cache"
  ON public.wine_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can modify wine cache"
  ON public.wine_cache FOR ALL
  USING (false);

-- Storage bucket for wine list images
-- Run this separately or via Supabase Dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('wine-lists', 'wine-lists', false);

-- Storage policies (configure in Supabase Dashboard or via SQL)
-- CREATE POLICY "Users can upload wine list images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'wine-lists' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own wine list images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'wine-lists' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
