-- Enable realtime on additional tables

-- Enable realtime on payment_proofs
alter publication supabase_realtime add table payment_proofs;

-- Enable realtime on notifications
alter publication supabase_realtime add table notifications;

-- Enable realtime on wallet_transactions
alter publication supabase_realtime add table wallet_transactions;

-- Enable realtime on profiles (for avatar/status updates)
alter publication supabase_realtime add table profiles;

-- Enable realtime on reviews
alter publication supabase_realtime add table reviews;

-- Verify they're all enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
