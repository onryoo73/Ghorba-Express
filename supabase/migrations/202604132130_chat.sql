-- Chat threads/messages for buyer-traveler communication per order

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_threads_order on public.chat_threads(order_id);
create index if not exists idx_chat_messages_thread on public.chat_messages(thread_id, created_at);

drop trigger if exists chat_threads_set_updated_at on public.chat_threads;
create trigger chat_threads_set_updated_at
before update on public.chat_threads
for each row execute function public.set_updated_at();

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "participants can read chat threads" on public.chat_threads;
create policy "participants can read chat threads"
on public.chat_threads for select
using (auth.uid() = buyer_id or auth.uid() = traveler_id);

drop policy if exists "participants can create chat threads" on public.chat_threads;
create policy "participants can create chat threads"
on public.chat_threads for insert
with check (auth.uid() = buyer_id or auth.uid() = traveler_id);

drop policy if exists "participants can read chat messages" on public.chat_messages;
create policy "participants can read chat messages"
on public.chat_messages for select
using (
  exists (
    select 1 from public.chat_threads t
    where t.id = chat_messages.thread_id
      and (t.buyer_id = auth.uid() or t.traveler_id = auth.uid())
  )
);

drop policy if exists "participants can send chat messages" on public.chat_messages;
create policy "participants can send chat messages"
on public.chat_messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.chat_threads t
    where t.id = chat_messages.thread_id
      and (t.buyer_id = auth.uid() or t.traveler_id = auth.uid())
  )
);
