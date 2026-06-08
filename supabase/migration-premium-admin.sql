-- CanTrove — Admin premium user management
-- Safe to re-run. Run after migration-auth-complete.sql and migration-public-profiles.sql

-- ------------------------------------------------------------
-- 1. PROFILES — premium management fields
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists is_premium boolean default false not null,
  add column if not exists premium_source text,
  add column if not exists premium_expires_at timestamptz,
  add column if not exists premium_notes text;

comment on column public.profiles.is_premium is 'Admin-granted premium access flag';
comment on column public.profiles.premium_source is 'Badge tier: founder, beta_tester, early_tester, community_contributor, premium';
comment on column public.profiles.premium_expires_at is 'Null = lifetime premium';
comment on column public.profiles.premium_notes is 'Admin notes when granting premium';

-- Sync legacy premium_status for existing premium users
update public.profiles
set
  is_premium = true,
  premium_expires_at = coalesce(premium_expires_at, premium_until)
where premium_status = 'premium' and is_premium = false;

create index if not exists profiles_is_premium_idx
  on public.profiles (is_premium)
  where is_premium = true;

-- ------------------------------------------------------------
-- 2. ADMIN_ACTIONS — audit log
-- ------------------------------------------------------------

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details text,
  created_at timestamptz default now() not null
);

create index if not exists admin_actions_admin_idx
  on public.admin_actions (admin_user_id);

create index if not exists admin_actions_target_idx
  on public.admin_actions (target_user_id);

create index if not exists admin_actions_created_idx
  on public.admin_actions (created_at desc);

comment on table public.admin_actions is 'Audit log for admin user management actions';

-- ------------------------------------------------------------
-- 3. RLS — admin user management
-- ------------------------------------------------------------

alter table public.admin_actions enable row level security;

drop policy if exists "Admins can view admin actions" on public.admin_actions;
create policy "Admins can view admin actions"
  on public.admin_actions for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can insert admin actions" on public.admin_actions;
create policy "Admins can insert admin actions"
  on public.admin_actions for insert
  to authenticated
  with check (public.is_admin_user() and admin_user_id = auth.uid());

-- Admins can read all profiles (for user management)
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin_user());

-- Admins can update premium/role on any profile
drop policy if exists "Admins can manage user accounts" on public.profiles;
create policy "Admins can manage user accounts"
  on public.profiles for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Admins can count cans per user
drop policy if exists "Admins can view all cans" on public.cans;
create policy "Admins can view all cans"
  on public.cans for select
  to authenticated
  using (public.is_admin_user());

-- ------------------------------------------------------------
-- 4. PUBLIC PROFILE RPC — include premium badge fields
-- ------------------------------------------------------------

drop function if exists public.get_profile_by_username(text);

create function public.get_profile_by_username(p_username text)
returns table (
  id uuid,
  username text,
  public_display_name text,
  bio text,
  country text,
  avatar_url text,
  is_public_profile boolean,
  premium_status text,
  premium_until timestamptz,
  is_premium boolean,
  premium_source text,
  premium_expires_at timestamptz,
  featured_can_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.public_display_name,
    case when p.is_public_profile then p.bio else null end,
    case when p.is_public_profile then p.country else null end,
    case when p.is_public_profile then p.avatar_url else null end,
    p.is_public_profile,
    p.premium_status,
    p.premium_until,
    p.is_premium,
    p.premium_source,
    p.premium_expires_at,
    case when p.is_public_profile then p.featured_can_id else null end,
    p.created_at
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_profile_by_username(text) to anon, authenticated;
