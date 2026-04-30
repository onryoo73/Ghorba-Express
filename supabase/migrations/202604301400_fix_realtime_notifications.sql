-- Fix realtime issues: notifications policy and message trigger

-- 1. Add INSERT policy for notifications (so participants can notify each other)
drop policy if exists "participants can insert notifications" on public.notifications;
create policy "participants can insert notifications"
on public.notifications for insert
with check (
  -- Allow if sender is inserting
  auth.uid() = sender_id
  -- Or if the recipient is the user (for system notifications)
  or auth.uid() = recipient_id
);

-- 2. Function to create notification when new message is sent
create or replace function public.handle_new_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  sender_name text;
  thread_record record;
begin
  -- Get thread info to find the recipient (the other participant)
  select buyer_id, traveler_id into thread_record
  from public.chat_threads
  where id = new.thread_id;
  
  if thread_record is null then
    return new;
  end if;
  
  -- Determine recipient (the one who didn't send the message)
  if new.sender_id = thread_record.buyer_id then
    recipient_id := thread_record.traveler_id;
  else
    recipient_id := thread_record.buyer_id;
  end if;
  
  -- Get sender name
  select full_name into sender_name
  from public.profiles
  where id = new.sender_id;
  
  -- Create notification for recipient (only if not from themselves)
  if recipient_id != new.sender_id then
    insert into public.notifications (
      recipient_id,
      sender_id,
      type,
      thread_id,
      title,
      message,
      is_read
    ) values (
      recipient_id,
      new.sender_id,
      'message',
      new.thread_id,
      'New message from ' || coalesce(sender_name, 'Someone'),
      left(new.message, 100),
      false
    );
  end if;
  
  return new;
end;
$$;

-- 3. Create trigger for message notifications
drop trigger if exists on_chat_message_created on public.chat_messages;
create trigger on_chat_message_created
after insert on public.chat_messages
for each row
execute function public.handle_new_message_notification();

-- 4. Function to update thread's updated_at when new message arrives
-- (this helps with ordering threads by most recent activity)
create or replace function public.update_thread_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_threads
  set updated_at = now()
  where id = new.thread_id;
  
  return new;
end;
$$;

-- 5. Create trigger for updating thread timestamp
drop trigger if exists on_chat_message_update_thread on public.chat_messages;
create trigger on_chat_message_update_thread
after insert on public.chat_messages
for each row
execute function public.update_thread_on_message();

-- 6. Enable realtime on chat_threads (if not already done)
-- This allows users to see when threads are updated (new messages, status changes)
alter publication supabase_realtime add table chat_threads;

-- 7. Ensure notifications are in realtime
alter publication supabase_realtime add table notifications;

-- Verify all realtime tables
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
