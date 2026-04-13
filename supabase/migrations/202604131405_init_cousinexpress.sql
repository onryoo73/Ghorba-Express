-- CousinExpress MVP schema
-- Run this in Supabase SQL editor or via supabase migration tooling.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('buyer', 'traveler', 'both');
create type public.order_type as enum ('buy_and_bring', 'pickup_and_bring');
create type public.order_status as enum ('open', 'accepted', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed');
create type public.escrow_status as enum ('deposited', 'funds_locked', 'in_transit', 'delivered', 'released', 'refunded');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text,
  role public.user_role not null default 'buyer',
  rating numeric(3,2) not null default 5.00,
  total_deliveries integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  origin text not null,
  destination text not null,
  departure_date date not null,
  weight_available_kg numeric(6,2) not null check (weight_available_kg >= 0),
  price_per_kg_tnd numeric(10,2) check (price_per_kg_tnd >= 0),
  notes text,
  status text not null default 'open' check (status in ('open', 'full', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  traveler_id uuid references public.profiles(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  type public.order_type not null,
  product_price_tnd numeric(10,2) check (product_price_tnd >= 0),
  reward_tnd numeric(10,2) not null check (reward_tnd >= 0),
  item_description text not null,
  item_weight_kg numeric(6,2) check (item_weight_kg >= 0),
  origin text not null,
  destination text not null,
  status public.order_status not null default 'open',
  delivery_qr_token text unique default encode(gen_random_bytes(16), 'hex'),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_price_required_for_buy_and_bring check (
    (type = 'buy_and_bring' and product_price_tnd is not null)
    or (type = 'pickup_and_bring')
  )
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('d17', 'flouci', 'other')),
  image_url text not null,
  amount_tnd numeric(10,2) not null check (amount_tnd >= 0),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.escrow_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete cascade,
  payee_id uuid references public.profiles(id) on delete set null,
  amount_tnd numeric(10,2) not null check (amount_tnd >= 0),
  status public.escrow_status not null default 'deposited',
  timeline jsonb not null default jsonb_build_array(
    jsonb_build_object('status', 'deposited', 'at', now())
  ),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, reviewer_id, reviewee_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'buyer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists escrow_transactions_set_updated_at on public.escrow_transactions;
create trigger escrow_transactions_set_updated_at
before update on public.escrow_transactions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.orders enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.escrow_transactions enable row level security;
alter table public.reviews enable row level security;

-- Profiles
create policy "profiles are publicly readable"
on public.profiles for select
using (true);

create policy "users can update their profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Trips
create policy "trips are publicly readable"
on public.trips for select
using (true);

create policy "travelers can create own trips"
on public.trips for insert
with check (auth.uid() = traveler_id);

create policy "travelers can update own trips"
on public.trips for update
using (auth.uid() = traveler_id)
with check (auth.uid() = traveler_id);

create policy "travelers can delete own trips"
on public.trips for delete
using (auth.uid() = traveler_id);

-- Orders
create policy "buyer and traveler can read order"
on public.orders for select
using (auth.uid() = buyer_id or auth.uid() = traveler_id);

create policy "buyers can create orders"
on public.orders for insert
with check (auth.uid() = buyer_id);

create policy "buyer or traveler can update order"
on public.orders for update
using (auth.uid() = buyer_id or auth.uid() = traveler_id)
with check (auth.uid() = buyer_id or auth.uid() = traveler_id);

-- Payment proofs
create policy "buyer and traveler can read proofs"
on public.payment_proofs for select
using (
  auth.uid() = buyer_id
  or exists (
    select 1 from public.orders o
    where o.id = payment_proofs.order_id and o.traveler_id = auth.uid()
  )
);

create policy "buyer can create proof for own orders"
on public.payment_proofs for insert
with check (
  auth.uid() = buyer_id
  and exists (
    select 1 from public.orders o
    where o.id = payment_proofs.order_id and o.buyer_id = auth.uid()
  )
);

-- Escrow
create policy "buyer and traveler can read escrow"
on public.escrow_transactions for select
using (
  auth.uid() = payer_id
  or auth.uid() = payee_id
);

create policy "buyer can create escrow for own order"
on public.escrow_transactions for insert
with check (
  auth.uid() = payer_id
  and exists (
    select 1 from public.orders o
    where o.id = escrow_transactions.order_id and o.buyer_id = auth.uid()
  )
);

create policy "participants can update escrow"
on public.escrow_transactions for update
using (auth.uid() = payer_id or auth.uid() = payee_id)
with check (auth.uid() = payer_id or auth.uid() = payee_id);

-- Reviews
create policy "reviews are publicly readable"
on public.reviews for select
using (true);

create policy "order participants can create reviews"
on public.reviews for insert
with check (
  auth.uid() = reviewer_id
  and exists (
    select 1
    from public.orders o
    where o.id = reviews.order_id
      and (o.buyer_id = auth.uid() or o.traveler_id = auth.uid())
      and status in ('delivered', 'completed')
  )
);
