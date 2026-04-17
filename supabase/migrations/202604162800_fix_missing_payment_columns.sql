-- Fix missing columns for payment release and traveler payment info
-- Run this if you're getting 400 errors about missing columns

-- Add payment_released columns if they don't exist
ALTER TABLE public.post_offers
ADD COLUMN IF NOT EXISTS payment_released boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_released_at timestamptz;

-- Add traveler payment info columns if they don't exist
ALTER TABLE public.post_offers
ADD COLUMN IF NOT EXISTS traveler_payment_method TEXT CHECK (traveler_payment_method IN ('d17', 'flouci', 'bank_transfer')),
ADD COLUMN IF NOT EXISTS traveler_payment_number TEXT,
ADD COLUMN IF NOT EXISTS traveler_payment_name TEXT;

-- Add delivery confirmation columns if they don't exist
ALTER TABLE public.post_offers
ADD COLUMN IF NOT EXISTS delivery_otp text,
ADD COLUMN IF NOT EXISTS otp_generated_at timestamptz,
ADD COLUMN IF NOT EXISTS traveler_confirmed_delivery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS traveler_confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS buyer_confirmed_receipt boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS buyer_confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_verified_at timestamptz;

-- Update delivery_status check constraint
ALTER TABLE public.post_offers 
DROP CONSTRAINT IF EXISTS post_offers_delivery_status_check;

ALTER TABLE public.post_offers 
ADD CONSTRAINT post_offers_delivery_status_check 
CHECK (delivery_status IN ('pending', 'in_transit', 'delivered', 'buyer_confirmed', 'completed'));

-- Create OTP generation function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_delivery_otp()
RETURNS text AS $$
BEGIN
  RETURN lpad(floor(random() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create index for OTP lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_post_offers_otp ON public.post_offers(delivery_otp);

-- Enable RLS policy for OTP viewing
DROP POLICY IF EXISTS "buyers can view their delivery otp" ON public.post_offers;
CREATE POLICY "buyers can view their delivery otp"
ON public.post_offers FOR SELECT
USING (auth.uid() = buyer_id OR delivery_otp IS NULL);
