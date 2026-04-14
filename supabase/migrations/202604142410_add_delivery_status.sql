-- Add missing delivery_status column to post_offers
ALTER TABLE public.post_offers 
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending' 
  CHECK (delivery_status IN ('pending', 'in_transit', 'delivered', 'confirmed'));

-- Update existing rows
UPDATE public.post_offers 
  SET delivery_status = 'pending' 
  WHERE delivery_status IS NULL;
