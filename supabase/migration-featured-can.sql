-- CanTrove — Featured can on public collector profiles
-- Run after migration-public-profiles.sql

alter table public.profiles
  add column if not exists featured_can_id uuid references public.cans(id) on delete set null;

comment on column public.profiles.featured_can_id is 'Single highlighted can shown on public profile';

create index if not exists profiles_featured_can_idx
  on public.profiles (featured_can_id)
  where featured_can_id is not null;

-- Extend username lookup RPC to include featured can
-- Must drop first when adding a new return column (Postgres 42P13)
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
    case when p.is_public_profile then p.featured_can_id else null end,
    p.created_at
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_profile_by_username(text) to anon, authenticated;
