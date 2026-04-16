-- Add offer_id to reviews table
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.post_offers(id) ON DELETE CASCADE,
  ALTER COLUMN order_id DROP NOT NULL;

-- Ensure RLS allows users to see reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
