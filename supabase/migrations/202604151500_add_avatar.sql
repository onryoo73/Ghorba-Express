-- Add avatar column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for avatars if not exists
-- Note: This needs to be done in Supabase dashboard or via API
