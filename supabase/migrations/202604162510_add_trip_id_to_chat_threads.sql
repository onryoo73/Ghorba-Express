-- Add trip_id to chat_threads for trip-based conversations
-- Make post_id nullable since chats can be about trips OR posts

-- First make post_id nullable (ignore if it doesn't have NOT NULL constraint)
ALTER TABLE public.chat_threads ALTER COLUMN post_id DROP NOT NULL;

-- Add trip_id column (nullable)
ALTER TABLE public.chat_threads 
ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL;

-- Add index for trip_id lookups
CREATE INDEX IF NOT EXISTS idx_chat_threads_trip ON public.chat_threads(trip_id);

-- Add post_id column if it doesn't exist (for safety)
ALTER TABLE public.chat_threads
ADD COLUMN IF NOT EXISTS post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;
