-- CanTrove — Public profile lookup fix (run if /u/{username} shows "not found" but row exists)
-- Idempotent. Safe to run after migration-public-profiles.sql

-- Ensure anon/authenticated can read public profiles
drop policy if exists "Anyone can view public profiles" on public.profiles;
create policy "Anyone can view public profiles"
  on public.profiles for select
  to anon, authenticated
  using (is_public_profile = true);

-- Ensure public cans policy exists for anon visitors
drop policy if exists "Public can view cans of public profiles" on public.cans;
create policy "Public can view cans of public profiles"
  on public.cans for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = cans.user_id
        and p.is_public_profile = true
    )
  );

-- Recreate username lookup RPC (security definer bypasses RLS for private-profile detection)
create or replace function public.get_profile_by_username(p_username text)
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
    p.created_at
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_profile_by_username(text) to anon, authenticated;
