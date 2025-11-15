-- Create storage bucket for wine list images
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('wine-lists', 'wine-lists', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for wine-lists bucket
-- Allow users to upload their own wine list images
CREATE POLICY "Users can upload wine list images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'wine-lists' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own images
CREATE POLICY "Users can view own wine list images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'wine-lists' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own images
CREATE POLICY "Users can delete own wine list images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'wine-lists' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

