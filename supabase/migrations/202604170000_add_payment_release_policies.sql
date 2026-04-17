-- Add RLS policies for payment release flow

-- Policy 1: Travelers can update their own payment info
DROP POLICY IF EXISTS "travelers can update own payment info" ON public.post_offers;
CREATE POLICY "travelers can update own payment info"
ON public.post_offers FOR UPDATE
USING (auth.uid() = traveler_id);

-- Policy 2: Travelers can view their own post offers (for seeing payment status)
DROP POLICY IF EXISTS "travelers can view own offers" ON public.post_offers;
CREATE POLICY "travelers can view own offers"
ON public.post_offers FOR SELECT
USING (auth.uid() = traveler_id OR auth.uid() = buyer_id OR auth.uid() = offerer_id);

-- Policy 3: Buyers can update their own post offers (for confirming receipt)
DROP POLICY IF EXISTS "buyers can update own offers" ON public.post_offers;
CREATE POLICY "buyers can update own offers"
ON public.post_offers FOR UPDATE
USING (auth.uid() = buyer_id);

-- Policy 4: Admins can view all post_offers
-- Note: For admin access, we use service role key which bypasses RLS
-- But let's also make sure authenticated users can at least see relevant offers
DROP POLICY IF EXISTS "participants can view all relevant offers" ON public.post_offers;
CREATE POLICY "participants can view all relevant offers"
ON public.post_offers FOR SELECT
USING (
  auth.uid() = traveler_id OR 
  auth.uid() = buyer_id OR 
  auth.uid() = offerer_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
