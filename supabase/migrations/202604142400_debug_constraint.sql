-- Debug and fix payment_status constraint

-- Step 1: See what constraints exist
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.post_offers'::regclass 
  AND contype = 'c';

-- Step 2: Drop ALL check constraints on payment_status
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.post_offers'::regclass 
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%payment%'
  LOOP
    EXECUTE format('ALTER TABLE public.post_offers DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Step 3: Add correct constraint
ALTER TABLE public.post_offers 
  ADD CONSTRAINT post_offers_payment_status_check 
  CHECK (payment_status IN ('awaiting_acceptance', 'pending', 'authorized', 'captured', 'failed', 'refunded'));

-- Step 4: Update bad values
UPDATE public.post_offers 
  SET payment_status = 'awaiting_acceptance' 
  WHERE payment_status IS NULL 
     OR payment_status NOT IN ('awaiting_acceptance', 'pending', 'authorized', 'captured', 'failed', 'refunded');

-- Step 5: Verify
SELECT DISTINCT payment_status FROM public.post_offers;
