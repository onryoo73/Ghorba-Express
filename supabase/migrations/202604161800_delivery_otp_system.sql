-- Delivery OTP System Migration
-- Adds OTP-based delivery confirmation and payment release

-- Add OTP and confirmation fields to post_offers
alter table public.post_offers 
  add column if not exists delivery_otp text,
  add column if not exists otp_generated_at timestamptz,
  add column if not exists traveler_confirmed_delivery boolean default false,
  add column if not exists traveler_confirmed_at timestamptz,
  add column if not exists buyer_confirmed_receipt boolean default false,
  add column if not exists buyer_confirmed_at timestamptz,
  add column if not exists otp_verified boolean default false,
  add column if not exists otp_verified_at timestamptz,
  add column if not exists payment_released boolean default false,
  add column if not exists payment_released_at timestamptz;

-- Add status for delivery confirmation flow
alter table public.post_offers drop constraint if exists post_offers_delivery_status_check;
alter table public.post_offers add constraint post_offers_delivery_status_check 
  check (delivery_status in ('pending', 'in_transit', 'delivered', 'buyer_confirmed', 'completed'));

-- Create function to generate random 6-digit OTP
CREATE OR REPLACE FUNCTION generate_delivery_otp()
RETURNS text AS $$
BEGIN
  RETURN lpad(floor(random() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_post_offers_otp ON public.post_offers(delivery_otp);

-- RLS: Only buyer can see their OTP
CREATE POLICY "buyers can view their delivery otp"
ON public.post_offers FOR SELECT
USING (auth.uid() = buyer_id OR delivery_otp IS NULL);

-- Note: Travelers should NOT see the OTP until buyer confirms receipt
