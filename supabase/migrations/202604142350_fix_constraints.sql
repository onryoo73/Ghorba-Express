-- Fix constraints for payment flow

-- First, drop existing payment_status constraint if exists
DO $$ 
BEGIN
  -- Check if constraint exists and drop it
  ALTER TABLE public.post_offers 
    DROP CONSTRAINT IF EXISTS post_offers_payment_status_check;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Drop any other constraints on payment_status
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT tc.constraint_name INTO con_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'post_offers' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%payment%';
    
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.post_offers DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

-- Add the correct constraint with awaiting_acceptance
ALTER TABLE public.post_offers 
  ADD CONSTRAINT post_offers_payment_status_check 
  CHECK (payment_status IN ('awaiting_acceptance', 'pending', 'authorized', 'captured', 'failed', 'refunded'));

-- Update any existing rows that might have invalid values
UPDATE public.post_offers 
  SET payment_status = 'awaiting_acceptance' 
  WHERE payment_status IS NULL OR payment_status = '';

-- Also ensure status constraint is correct
ALTER TABLE public.post_offers 
  DROP CONSTRAINT IF EXISTS post_offers_status_check;

ALTER TABLE public.post_offers 
  ADD CONSTRAINT post_offers_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed'));
