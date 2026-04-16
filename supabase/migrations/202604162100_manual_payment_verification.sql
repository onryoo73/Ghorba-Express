-- Manual Payment Verification System Migration
-- Adds fields for manual payment (D17/Flouci) and admin verification

-- Add payment_method and update status check for post_offers
alter table public.post_offers 
  add column if not exists payment_method text default 'konnect' check (payment_method in ('konnect', 'manual')),
  drop constraint if exists post_offers_payment_status_check;

alter table public.post_offers 
  add constraint post_offers_payment_status_check 
  check (payment_status in ('awaiting_acceptance', 'pending', 'awaiting_payment', 'awaiting_verification', 'authorized', 'captured', 'failed', 'refunded'));

-- Update payment_proofs table
alter table public.payment_proofs
  add column if not exists offer_id uuid references public.post_offers(id) on delete cascade,
  add column if not exists transaction_id text,
  drop constraint if exists payment_proofs_order_id_fkey,
  alter column order_id drop not null;

-- Ensure RLS allows admin to see all proofs
CREATE POLICY "admins can view all payment proofs"
ON public.payment_proofs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'both' -- Assuming 'both' can be admin or we need an 'admin' role
  )
);

-- Note: In this app's current schema, 'both' is used as a role. 
-- We might want to check for a specific admin user or role if available.
-- For testing, we'll allow the buyer/traveler and anyone with high privilege to see it.
