-- Add is_read to chat_messages
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Add recipient_id to chat_messages for easier querying
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id);

-- Add platform_fee to wallet_transaction types and allow null user_id for platform revenue
ALTER TABLE public.wallet_transactions 
  DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE public.wallet_transactions 
  ADD CONSTRAINT wallet_transactions_type_check 
  CHECK (type IN ('deposit', 'withdrawal', 'payment', 'earning', 'refund', 'platform_fee'));

-- Allow user_id to be null (represents platform/system account)
ALTER TABLE public.wallet_transactions 
  ALTER COLUMN user_id DROP NOT NULL;
