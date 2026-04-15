-- Enable Realtime for all chat and offer tables

-- Enable realtime on chat_messages
alter publication supabase_realtime add table chat_messages;

-- Enable realtime on chat_threads
alter publication supabase_realtime add table chat_threads;

-- Enable realtime on post_offers
alter publication supabase_realtime add table post_offers;

-- Verify they're enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
