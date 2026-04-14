-- Payment & Escrow Migration
-- Adds payment tracking to offers and chat threads

-- Add payment fields to post_offers
alter table public.post_offers 
  add column if not exists buyer_id uuid references public.profiles(id),
  add column if not exists traveler_id uuid references public.profiles(id),
  add column if not exists payment_intent_id text,
  add column if not exists payment_status text default 'pending' check (payment_status in ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  add column if not exists amount_tnd numeric(10,2),
  add column if not exists platform_fee_tnd numeric(10,2),
  add column if not exists total_paid_tnd numeric(10,2),
  add column if not exists delivery_confirmed_at timestamptz,
  add column if not exists completed_at timestamptz;

-- Update status check to include 'completed'
alter table public.post_offers drop constraint if exists post_offers_status_check;
alter table public.post_offers add constraint post_offers_status_check 
  check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed'));

-- Add payment fields to chat_threads
alter table public.chat_threads
  add column if not exists offer_id uuid references public.post_offers(id),
  add column if not exists payment_intent_id text,
  add column if not exists delivery_status text default 'pending' check (delivery_status in ('pending', 'in_transit', 'delivered', 'confirmed'));

-- Create payments table for history
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid primary key default gen_random_uuid(),
    offer_id uuid references public.post_offers(id) on delete cascade,
    buyer_id uuid not null references public.profiles(id),
    traveler_id uuid not null references public.profiles(id),
    stripe_payment_intent_id text not null,
    amount_tnd numeric(10,2) not null,
    platform_fee_tnd numeric(10,2) not null,
    traveler_earnings_tnd numeric(10,2) not null,
    status text not null default 'authorized' check (status in ('authorized', 'captured', 'refunded', 'failed')),
    authorized_at timestamptz not null default now(),
    captured_at timestamptz,
    created_at timestamptz not null default now()
);

-- Enable RLS on payments
alter table public.payments enable row level security;

-- RLS: Users can see their own payments
CREATE POLICY "users can view own payments"
ON public.payments FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = traveler_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_payments_offer ON public.payments(offer_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer ON public.payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_traveler ON public.payments(traveler_id);

-- Index for offer lookups
CREATE INDEX IF NOT EXISTS idx_post_offers_payment ON public.post_offers(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_offer ON public.chat_threads(offer_id);
