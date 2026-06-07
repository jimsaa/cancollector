-- Can Collector — Supabase Auth complete migration
-- Run after migration.sql on new or existing projects
-- Idempotent: safe to re-run

-- ------------------------------------------------------------
-- 1. PROFILES TABLE + ROLE
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

alter table public.profiles
  add column if not exists updated_at timestamptz default now() not null,
  add column if not exists role text default 'user' not null;

-- Fix role constraint if column existed without check
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
exception when others then
  null;
end $$;

-- Migrate legacy is_admin flag if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_admin'
  ) then
    update public.profiles set role = 'admin' where is_admin = true and role = 'user';
  end if;
end $$;

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

comment on table public.profiles is 'User profiles linked to auth.users';
comment on column public.profiles.role is 'user or admin';

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing auth users
insert into public.profiles (id, email, display_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  'user'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. ADMIN HELPER (for RLS in other migrations)
-- ------------------------------------------------------------

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — profiles
-- ------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY — cans (authenticated users only)
-- ------------------------------------------------------------

alter table public.cans enable row level security;

drop policy if exists "Users can view own cans" on public.cans;
create policy "Users can view own cans"
  on public.cans for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cans" on public.cans;
create policy "Users can insert own cans"
  on public.cans for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cans" on public.cans;
create policy "Users can update own cans"
  on public.cans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cans" on public.cans;
create policy "Users can delete own cans"
  on public.cans for delete
  to authenticated
  using (auth.uid() = user_id);
