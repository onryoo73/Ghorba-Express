-- Add all missing columns to post_offers table

-- Core relationship fields
ALTER TABLE public.post_offers 
  ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS traveler_id uuid REFERENCES public.profiles(id);

-- Payment fields
ALTER TABLE public.post_offers 
  ADD COLUMN IF NOT EXISTS item_price_tnd decimal(10,2),
  ADD COLUMN IF NOT EXISTS amount_tnd decimal(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee_tnd decimal(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee_rate integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS total_paid_tnd decimal(10,2),
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'awaiting_acceptance',
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update existing records to have valid payment_status
UPDATE public.post_offers 
SET payment_status = 'awaiting_acceptance' 
WHERE payment_status IS NULL;

-- Add constraint for payment_status values
ALTER TABLE public.post_offers 
  DROP CONSTRAINT IF EXISTS post_offers_payment_status_check;

ALTER TABLE public.post_offers 
  ADD CONSTRAINT post_offers_payment_status_check 
  CHECK (payment_status IN ('awaiting_acceptance', 'pending', 'awaiting_payment', 'authorized', 'captured', 'failed', 'refunded'));

-- Add constraint for delivery_status values
ALTER TABLE public.post_offers 
  DROP CONSTRAINT IF EXISTS post_offers_delivery_status_check;

ALTER TABLE public.post_offers 
  ADD CONSTRAINT post_offers_delivery_status_check 
  CHECK (delivery_status IN ('pending', 'in_transit', 'delivered', 'confirmed'));
