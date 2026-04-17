-- Add traveler payment info to post_offers table
-- This stores D17/Flouci details for admin to release payment

-- Add columns for traveler payment method
ALTER TABLE public.post_offers
ADD COLUMN IF NOT EXISTS traveler_payment_method TEXT CHECK (traveler_payment_method IN ('d17', 'flouci', 'bank_transfer')),
ADD COLUMN IF NOT EXISTS traveler_payment_number TEXT,
ADD COLUMN IF NOT EXISTS traveler_payment_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.post_offers.traveler_payment_method IS 'Payment method traveler wants to receive: d17, flouci, or bank_transfer';
COMMENT ON COLUMN public.post_offers.traveler_payment_number IS 'Phone number or account number for payment';
COMMENT ON COLUMN public.post_offers.traveler_payment_name IS 'Name associated with the payment account';
