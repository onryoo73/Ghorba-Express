-- Backend operational tables and policies

do $$
begin
  create type public.dispute_status as enum ('open', 'investigating', 'resolved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_channel as enum ('in_app', 'email', 'sms');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete cascade,
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status public.dispute_status not null default 'open',
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_disputes_status on public.disputes(status);
create index if not exists idx_disputes_order_id on public.disputes(order_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);

drop trigger if exists disputes_set_updated_at on public.disputes;
create trigger disputes_set_updated_at
before update on public.disputes
for each row execute function public.set_updated_at();

alter table public.disputes enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
on public.notifications for select
using (auth.uid() = user_id);

drop policy if exists "order participants read disputes" on public.disputes;
create policy "order participants read disputes"
on public.disputes for select
using (
  exists (
    select 1 from public.orders o
    where o.id = disputes.order_id
      and (o.buyer_id = auth.uid() or o.traveler_id = auth.uid())
  )
);

drop policy if exists "order participants create disputes" on public.disputes;
create policy "order participants create disputes"
on public.disputes for insert
with check (
  auth.uid() = opened_by
  and exists (
    select 1 from public.orders o
    where o.id = disputes.order_id
      and (o.buyer_id = auth.uid() or o.traveler_id = auth.uid())
  )
);
