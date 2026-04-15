-- Create avatars storage bucket
-- Note: This uses Supabase's storage API via RPC or needs to be done via dashboard
-- Alternative: Create bucket via Supabase Dashboard > Storage > New bucket

-- Enable storage schema if not exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create buckets table if not exists (Supabase handles this, but just in case)
-- The bucket needs to be created via API or dashboard

-- Create RLS policies for avatars bucket (once bucket exists)
-- These will apply after you create the bucket in dashboard

-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read any avatar
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
