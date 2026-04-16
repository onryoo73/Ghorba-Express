-- Update chat_threads.updated_at when a new message is inserted
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.chat_threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chat_message_inserted ON public.chat_messages;
CREATE TRIGGER on_chat_message_inserted
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_chat_message();
