-- Strict auth and role dashboards expansion

create type public.kyc_status as enum ('pending', 'approved', 'rejected');
create type public.dispute_status as enum ('open', 'investigating', 'resolved', 'rejected');
create type public.withdraw_status as enum ('pending', 'approved', 'rejected', 'paid');

alter table public.profiles
  add column if not exists phone_e164 text unique,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists kyc_status public.kyc_status not null default 'pending',
  add column if not exists risk_flags text[] not null default '{}',
  add column if not exists is_admin boolean not null default false;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_phone_verified on public.profiles(phone_verified);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete cascade,
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status public.dispute_status not null default 'open',
  admin_notes text,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_disputes_status on public.disputes(status);
create index if not exists idx_disputes_order on public.disputes(order_id);

create table if not exists public.withdraw_requests (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  amount_tnd numeric(10,2) not null check (amount_tnd > 0),
  payout_method text not null default 'bank_transfer',
  payout_reference text,
  status public.withdraw_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_withdraw_requests_traveler on public.withdraw_requests(traveler_id);
create index if not exists idx_withdraw_requests_status on public.withdraw_requests(status);

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from auth.users au
    left join public.profiles p on p.id = au.id
    where au.id = auth.uid()
      and (
        lower(coalesce(au.email, '')) = lower(coalesce(current_setting('app.admin_email', true), ''))
        or coalesce(p.is_admin, false) = true
      )
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, phone_e164, phone_verified)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, new.phone, new.id::text), '@', 1)
    ),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'buyer'),
    new.phone,
    new.phone is not null
  )
  on conflict (id) do update
  set
    phone_e164 = coalesce(excluded.phone_e164, public.profiles.phone_e164),
    phone_verified = public.profiles.phone_verified or excluded.phone_verified,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists disputes_set_updated_at on public.disputes;
create trigger disputes_set_updated_at
before update on public.disputes
for each row execute function public.set_updated_at();

drop trigger if exists withdraw_requests_set_updated_at on public.withdraw_requests;
create trigger withdraw_requests_set_updated_at
before update on public.withdraw_requests
for each row execute function public.set_updated_at();

alter table public.disputes enable row level security;
alter table public.withdraw_requests enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are limited readable"
on public.profiles for select
using (auth.uid() = id or public.is_admin_user());

drop policy if exists "users can update their profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
);

create policy "admin can update any profile"
on public.profiles for update
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "order participants can create disputes"
on public.disputes for insert
with check (
  auth.uid() = opened_by
  and exists (
    select 1 from public.orders o
    where o.id = disputes.order_id
      and (o.buyer_id = auth.uid() or o.traveler_id = auth.uid())
  )
);

create policy "order participants and admins read disputes"
on public.disputes for select
using (
  public.is_admin_user()
  or exists (
    select 1 from public.orders o
    where o.id = disputes.order_id
      and (o.buyer_id = auth.uid() or o.traveler_id = auth.uid())
  )
);

create policy "admins manage disputes"
on public.disputes for update
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "traveler creates own withdraw request"
on public.withdraw_requests for insert
with check (auth.uid() = traveler_id);

create policy "traveler reads own withdraw request"
on public.withdraw_requests for select
using (auth.uid() = traveler_id or public.is_admin_user());

create policy "admins manage withdraw requests"
on public.withdraw_requests for update
using (public.is_admin_user())
with check (public.is_admin_user());

