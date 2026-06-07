-- ============================================================
-- Can Collector (cancollector) — complete Supabase migration
-- Safe to run on a new Supabase project (idempotent where possible)
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 0. SHARED HELPERS
-- ------------------------------------------------------------

-- Automatically set updated_at on row changes
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    ),
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  premium_status text default 'free' not null
    check (premium_status in ('free', 'premium')),
  premium_until timestamptz,
  role text default 'user' not null check (role in ('user', 'admin'))
);

comment on table public.profiles is 'User profiles linked to auth.users';

-- Add updated_at if upgrading from an older schema
alter table public.profiles
  add column if not exists updated_at timestamptz default now() not null,
  add column if not exists role text default 'user' not null;

-- ------------------------------------------------------------
-- 2. CANS TABLE
-- ------------------------------------------------------------

create table if not exists public.cans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  barcode text,
  name text,
  brand text,
  flavor text,
  volume text,
  country text,
  country_variant text,
  image_url text,
  opened boolean default false not null,
  purchase_date date,
  added_date timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  available_for_trade boolean default false not null,
  notes text,
  rarity text default 'unknown' not null
    check (rarity in ('common', 'uncommon', 'rare', 'unknown')),
  quantity integer default 1 not null check (quantity >= 1),
  is_wishlist boolean default false not null,
  wishlist_status text check (
    wishlist_status is null or wishlist_status in ('wanted', 'missing')
  )
);

comment on table public.cans is 'User Monster Energy can collections';

-- Add columns if upgrading from an older schema
alter table public.cans
  add column if not exists country_variant text,
  add column if not exists is_wishlist boolean default false not null,
  add column if not exists wishlist_status text,
  add column if not exists updated_at timestamptz default now() not null;

-- ------------------------------------------------------------
-- 3. INDEXES
-- ------------------------------------------------------------

create index if not exists profiles_email_idx
  on public.profiles (email);

create index if not exists cans_user_id_idx
  on public.cans (user_id);

create index if not exists cans_added_date_idx
  on public.cans (added_date desc);

create index if not exists cans_user_added_date_idx
  on public.cans (user_id, added_date desc);

create index if not exists cans_barcode_idx
  on public.cans (user_id, barcode)
  where barcode is not null;

create index if not exists cans_available_for_trade_idx
  on public.cans (available_for_trade)
  where available_for_trade = true;

create index if not exists cans_wishlist_idx
  on public.cans (user_id, is_wishlist)
  where is_wishlist = true;

-- ------------------------------------------------------------
-- 4. UPDATED_AT TRIGGERS
-- ------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists cans_set_updated_at on public.cans;
create trigger cans_set_updated_at
  before update on public.cans
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. AUTH TRIGGER — auto-create profile on sign up
-- ------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY — profiles
-- ------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY — cans
-- ------------------------------------------------------------

alter table public.cans enable row level security;

drop policy if exists "Users can view own cans" on public.cans;
create policy "Users can view own cans"
  on public.cans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cans" on public.cans;
create policy "Users can insert own cans"
  on public.cans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cans" on public.cans;
create policy "Users can update own cans"
  on public.cans for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own cans" on public.cans;
create policy "Users can delete own cans"
  on public.cans for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8. STORAGE — can-images bucket (future / current image uploads)
-- Upload path pattern: {user_id}/{uuid}.{ext}
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('can-images', 'can-images', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload can images" on storage.objects;
create policy "Users can upload can images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view can images" on storage.objects;
create policy "Anyone can view can images"
  on storage.objects for select
  using (bucket_id = 'can-images');

drop policy if exists "Users can update own can images" on storage.objects;
create policy "Users can update own can images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own can images" on storage.objects;
create policy "Users can delete own can images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- Done. Also run migration-master-cans.sql for the global can database.
-- Verify: profiles, cans, master_cans (RLS on), Storage: can-images
-- ============================================================
