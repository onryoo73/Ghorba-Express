-- Social Feed Features Migration
-- Adds posts, likes, comments, bookmarks, and notifications

do $$
begin
  create type public.post_type as enum ('request', 'trip');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_status as enum ('active', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum ('like', 'comment', 'offer', 'message', 'delivery_update', 'escrow_update');
exception
  when duplicate_object then null;
end $$;

-- Posts table (unified feed for both requests and trips)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type public.post_type not null,
  content text not null,
  
  -- Route info
  origin text,
  destination text,
  
  -- For trips
  departure_date date,
  weight_available_kg numeric(6,2),
  price_per_kg_tnd numeric(10,2),
  
  -- For requests
  product_price_tnd numeric(10,2),
  reward_tnd numeric(10,2),
  item_description text,
  item_weight_kg numeric(6,2),
  
  -- Images
  images text[] default '{}',
  
  -- Status
  status public.post_status not null default 'active',
  
  -- Stats
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Likes table
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- Comments table
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  parent_id uuid references public.post_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bookmarks/saves table
create table if not exists public.post_bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- Offers table (when a traveler wants to fulfill a request, or buyer wants a trip)
create table if not exists public.post_offers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  offerer_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  proposed_price_tnd numeric(10,2),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  
  -- Related entities (nullable depending on type)
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.post_comments(id) on delete cascade,
  offer_id uuid references public.post_offers(id) on delete cascade,
  thread_id uuid references public.chat_threads(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  
  -- Content
  title text not null,
  message text,
  
  -- Status
  is_read boolean not null default false,
  
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_posts_author on public.posts(author_id, created_at desc);
create index if not exists idx_posts_type_status on public.posts(type, status, created_at desc);
create index if not exists idx_posts_route on public.posts(origin, destination, status);
create index if not exists idx_post_likes_post on public.post_likes(post_id);
create index if not exists idx_post_likes_user on public.post_likes(user_id);
create index if not exists idx_post_comments_post on public.post_comments(post_id, created_at);
create index if not exists idx_post_bookmarks_user on public.post_bookmarks(user_id);
create index if not exists idx_post_offers_post on public.post_offers(post_id, status);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id, is_read, created_at desc);

-- Triggers for updated_at
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists post_comments_set_updated_at on public.post_comments;
create trigger post_comments_set_updated_at
before update on public.post_comments
for each row execute function public.set_updated_at();

drop trigger if exists post_offers_set_updated_at on public.post_offers;
create trigger post_offers_set_updated_at
before update on public.post_offers
for each row execute function public.set_updated_at();

-- Function to update likes_count
create or replace function public.update_post_likes_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists update_likes_count on public.post_likes;
create trigger update_likes_count
after insert or delete on public.post_likes
for each row execute function public.update_post_likes_count();

-- Function to update comments_count
create or replace function public.update_post_comments_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = comments_count - 1 where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists update_comments_count on public.post_comments;
create trigger update_comments_count
after insert or delete on public.post_comments
for each row execute function public.update_post_comments_count();

-- Function to create notification on like
create or replace function public.create_like_notification()
returns trigger
language plpgsql
as $$
declare
  post_author_id uuid;
begin
  select author_id into post_author_id from public.posts where id = new.post_id;
  
  if post_author_id != new.user_id then
    insert into public.notifications (
      recipient_id,
      sender_id,
      type,
      post_id,
      title,
      message
    ) values (
      post_author_id,
      new.user_id,
      'like',
      new.post_id,
      'New like on your post',
      'Someone liked your post'
    );
  end if;
  
  return new;
end;
$$;

drop trigger if exists create_like_notification on public.post_likes;
create trigger create_like_notification
after insert on public.post_likes
for each row execute function public.create_like_notification();

-- Function to create notification on comment
create or replace function public.create_comment_notification()
returns trigger
language plpgsql
as $$
declare
  post_author_id uuid;
  parent_author_id uuid;
begin
  select author_id into post_author_id from public.posts where id = new.post_id;
  
  -- Notify post author if not the commenter
  if post_author_id != new.author_id then
    insert into public.notifications (
      recipient_id,
      sender_id,
      type,
      post_id,
      comment_id,
      title,
      message
    ) values (
      post_author_id,
      new.author_id,
      'comment',
      new.post_id,
      new.id,
      'New comment on your post',
      'Someone commented on your post'
    );
  end if;
  
  -- Notify parent comment author if this is a reply
  if new.parent_id is not null then
    select author_id into parent_author_id from public.post_comments where id = new.parent_id;
    if parent_author_id != new.author_id and parent_author_id != post_author_id then
      insert into public.notifications (
        recipient_id,
        sender_id,
        type,
        post_id,
        comment_id,
        title,
        message
      ) values (
        parent_author_id,
        new.author_id,
        'comment',
        new.post_id,
        new.id,
        'New reply to your comment',
        'Someone replied to your comment'
      );
    end if;
  end if;
  
  return new;
end;
$$;

drop trigger if exists create_comment_notification on public.post_comments;
create trigger create_comment_notification
after insert on public.post_comments
for each row execute function public.create_comment_notification();

-- Row Level Security

-- Posts
alter table public.posts enable row level security;

-- Posts are publicly readable
drop policy if exists "posts are publicly readable" on public.posts;
create policy "posts are publicly readable"
on public.posts for select
using (true);

-- Users can create their own posts
drop policy if exists "users can create own posts" on public.posts;
create policy "users can create own posts"
on public.posts for insert
with check (auth.uid() = author_id);

-- Users can update their own posts
drop policy if exists "users can update own posts" on public.posts;
create policy "users can update own posts"
on public.posts for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

-- Users can delete their own posts
drop policy if exists "users can delete own posts" on public.posts;
create policy "users can delete own posts"
on public.posts for delete
using (auth.uid() = author_id);

-- Post Likes
alter table public.post_likes enable row level security;

drop policy if exists "post likes are publicly readable" on public.post_likes;
create policy "post likes are publicly readable"
on public.post_likes for select
using (true);

drop policy if exists "users can manage own likes" on public.post_likes;
create policy "users can manage own likes"
on public.post_likes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Post Comments
alter table public.post_comments enable row level security;

drop policy if exists "post comments are publicly readable" on public.post_comments;
create policy "post comments are publicly readable"
on public.post_comments for select
using (true);

drop policy if exists "users can manage own comments" on public.post_comments;
create policy "users can manage own comments"
on public.post_comments for all
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

-- Post Bookmarks
alter table public.post_bookmarks enable row level security;

drop policy if exists "users can read own bookmarks" on public.post_bookmarks;
create policy "users can read own bookmarks"
on public.post_bookmarks for select
using (auth.uid() = user_id);

drop policy if exists "users can manage own bookmarks" on public.post_bookmarks;
create policy "users can manage own bookmarks"
on public.post_bookmarks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Post Offers
alter table public.post_offers enable row level security;

drop policy if exists "post offers readable by participants" on public.post_offers;
create policy "post offers readable by participants"
on public.post_offers for select
using (
  auth.uid() = offerer_id
  or exists (
    select 1 from public.posts p where p.id = post_offers.post_id and p.author_id = auth.uid()
  )
);

drop policy if exists "users can create offers" on public.post_offers;
create policy "users can create offers"
on public.post_offers for insert
with check (
  auth.uid() = offerer_id
  and exists (
    select 1 from public.posts p 
    where p.id = post_offers.post_id 
    and p.author_id != auth.uid()
  )
);

drop policy if exists "participants can update offers" on public.post_offers;
create policy "participants can update offers"
on public.post_offers for update
using (
  auth.uid() = offerer_id
  or exists (
    select 1 from public.posts p where p.id = post_offers.post_id and p.author_id = auth.uid()
  )
);

-- Notifications
alter table public.notifications enable row level security;

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
on public.notifications for select
using (auth.uid() = recipient_id);

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
on public.notifications for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

drop policy if exists "users can delete own notifications" on public.notifications;
create policy "users can delete own notifications"
on public.notifications for delete
using (auth.uid() = recipient_id);
