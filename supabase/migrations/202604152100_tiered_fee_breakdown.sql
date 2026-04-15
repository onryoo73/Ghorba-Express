-- Add columns for tiered fee breakdown
ALTER TABLE public.post_offers 
  ADD COLUMN IF NOT EXISTS item_price_tnd decimal(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee_rate integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS total_paid_tnd decimal(10,2);

-- Add comment to explain the fields
COMMENT ON COLUMN public.post_offers.item_price_tnd IS 'Price of the item being delivered (for buy_and_bring orders)';
COMMENT ON COLUMN public.post_offers.platform_fee_rate IS 'Platform fee percentage (5%, 3%, or 2% based on tiered structure)';
COMMENT ON COLUMN public.post_offers.total_paid_tnd IS 'Total amount buyer pays (item_price + proposed_price + platform_fee)';

-- Update existing records to have default values where needed
UPDATE public.post_offers 
SET item_price_tnd = 0 
WHERE item_price_tnd IS NULL;

UPDATE public.post_offers 
SET total_paid_tnd = amount_tnd + COALESCE(platform_fee_tnd, 0) 
WHERE total_paid_tnd IS NULL;
