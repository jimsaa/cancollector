-- Can Collector — Auth & profiles migration
-- Run in Supabase SQL Editor after schema.sql (or on existing projects)
-- Safe to re-run where noted

-- ------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz default now() not null,
  premium_status text default 'free' not null
    check (premium_status in ('free', 'premium')),
  premium_until timestamptz
);

comment on table public.profiles is 'User profiles linked to auth.users';

create index if not exists profiles_email_idx on public.profiles (email);

-- ------------------------------------------------------------
-- 2. AUTO-CREATE PROFILE ON SIGN UP
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing auth users
insert into public.profiles (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY — profiles
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
-- 4. CANS TABLE — ensure user_id + v2 columns (if missing)
-- ------------------------------------------------------------
alter table public.cans
  add column if not exists country_variant text,
  add column if not exists is_wishlist boolean default false not null,
  add column if not exists wishlist_status text;

-- Re-apply cans RLS (idempotent)
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
