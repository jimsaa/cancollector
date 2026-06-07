-- Can Collector — Public collector profiles
-- Run after migration-auth-complete.sql
-- Idempotent

-- ------------------------------------------------------------
-- 1. PUBLIC PROFILE FIELDS
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists username text,
  add column if not exists public_display_name text,
  add column if not exists bio text,
  add column if not exists country text,
  add column if not exists avatar_url text,
  add column if not exists is_public_profile boolean default false not null;

comment on column public.profiles.username is 'Unique public handle for /u/{username}';
comment on column public.profiles.public_display_name is 'Name shown on public profile';
comment on column public.profiles.is_public_profile is 'When true, profile and collection stats are publicly visible';

-- Username format: lowercase letters, numbers, hyphen, underscore; 3–24 chars
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check check (
        username is null
        or (
          char_length(username) >= 3
          and char_length(username) <= 24
          and username ~ '^[a-z0-9_-]+$'
        )
      );
  end if;
exception when others then
  null;
end $$;

create unique index if not exists profiles_username_lower_unique_idx
  on public.profiles (lower(username))
  where username is not null;

create index if not exists profiles_is_public_idx
  on public.profiles (is_public_profile)
  where is_public_profile = true;

-- ------------------------------------------------------------
-- 2. RLS — public profile read
-- ------------------------------------------------------------

drop policy if exists "Anyone can view public profiles" on public.profiles;
create policy "Anyone can view public profiles"
  on public.profiles for select
  using (is_public_profile = true);

-- ------------------------------------------------------------
-- 3. RLS — public collection read (owners with public profile)
-- ------------------------------------------------------------

drop policy if exists "Public can view cans of public profiles" on public.cans;
create policy "Public can view cans of public profiles"
  on public.cans for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = cans.user_id
        and p.is_public_profile = true
    )
  );

-- ------------------------------------------------------------
-- 4. STORAGE — avatar-images bucket
-- Path pattern: {user_id}/avatar.jpg
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatar-images', 'avatar-images', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatar-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatar-images');

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatar-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatar-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- 5. RPC — resolve username without exposing private profile data
-- ------------------------------------------------------------

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
