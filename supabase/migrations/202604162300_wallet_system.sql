-- Add wallet balance to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS wallet_balance numeric(12,2) DEFAULT 0.00;

-- Create transactions table to track history
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    offer_id uuid REFERENCES public.post_offers(id) ON DELETE SET NULL,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'earning', 'refund')),
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);

-- RPC for atomic wallet balance updates
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + amount
  WHERE id = user_id;
END;
$$;

