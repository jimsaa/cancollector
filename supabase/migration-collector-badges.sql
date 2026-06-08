-- CanTrove — Collector badges + leaderboard support
-- Safe to re-run. Run after migration-public-profiles.sql
-- Includes premium profile columns if migration-premium-admin.sql was not run yet.

-- ------------------------------------------------------------
-- 0. PREREQUISITES — profiles columns used by RPCs below
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists premium_status text default 'free',
  add column if not exists premium_until timestamptz,
  add column if not exists is_premium boolean default false not null,
  add column if not exists premium_source text,
  add column if not exists premium_expires_at timestamptz,
  add column if not exists premium_notes text;

-- ------------------------------------------------------------
-- 1. BADGES catalog
-- ------------------------------------------------------------

create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  category text not null check (category in ('collection', 'set', 'trade', 'community', 'special')),
  emoji text not null default '🏅',
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum', 'special')),
  sort_order integer not null default 0,
  is_manual_only boolean not null default false,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------
-- 2. USER_BADGES — earned or admin-granted
-- ------------------------------------------------------------

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  source text not null default 'computed' check (source in ('computed', 'manual', 'premium')),
  granted_by uuid references auth.users(id) on delete set null,
  earned_at timestamptz default now() not null,
  unique (user_id, badge_id)
);

create index if not exists user_badges_user_idx on public.user_badges (user_id);
create index if not exists user_badges_badge_idx on public.user_badges (badge_id);

-- ------------------------------------------------------------
-- 3. BADGE_EVENTS — optional audit trail
-- ------------------------------------------------------------

create table if not exists public.badge_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  event_type text not null check (event_type in ('earned', 'revoked', 'featured')),
  actor_id uuid references auth.users(id) on delete set null,
  details text,
  created_at timestamptz default now() not null
);

create index if not exists badge_events_user_idx on public.badge_events (user_id, created_at desc);

-- ------------------------------------------------------------
-- 4. FEATURED BADGE on profiles
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists featured_badge_id text references public.badges(id) on delete set null;

comment on column public.profiles.featured_badge_id is 'Highlighted badge shown on public profile';

-- ------------------------------------------------------------
-- 5. SEED BADGES
-- ------------------------------------------------------------

insert into public.badges (id, name, description, category, emoji, tier, sort_order, is_manual_only) values
  ('first_can', 'First Can', 'Added your first can to the collection', 'collection', '🥫', 'bronze', 10, false),
  ('cans_10', '10 Cans', 'Collected 10 cans', 'collection', '📦', 'bronze', 20, false),
  ('cans_25', '25 Cans', 'Collected 25 cans', 'collection', '📦', 'silver', 30, false),
  ('cans_50', '50 Cans', 'Collected 50 cans', 'collection', '🗃️', 'silver', 40, false),
  ('cans_100', '100 Cans', 'Collected 100 cans', 'collection', '🏆', 'gold', 50, false),
  ('cans_250', '250 Cans', 'Collected 250 cans', 'collection', '💎', 'gold', 60, false),
  ('cans_500', '500 Cans', 'Collected 500 cans', 'collection', '👑', 'platinum', 70, false),
  ('ultra_collector', 'Ultra Collector', 'Strong progress in the Ultra set', 'set', '⚡', 'gold', 110, false),
  ('java_collector', 'Java Collector', 'Strong progress in the Java set', 'set', '☕', 'gold', 120, false),
  ('juice_collector', 'Juice Collector', 'Strong progress in the Juice set', 'set', '🍹', 'gold', 130, false),
  ('rehab_collector', 'Rehab Collector', 'Strong progress in the Rehab set', 'set', '🍵', 'gold', 140, false),
  ('reserve_collector', 'Reserve Collector', 'Strong progress in the Reserve set', 'set', '🎖️', 'gold', 150, false),
  ('nitro_collector', 'Nitro Collector', 'Strong progress in the Nitro set', 'set', '💨', 'gold', 160, false),
  ('zero_sugar_collector', 'Zero Sugar Collector', 'Strong progress in the Zero Sugar set', 'set', '🍬', 'gold', 170, false),
  ('first_trade_listing', 'First Trade Listing', 'Posted your first trade listing', 'trade', '🤝', 'bronze', 210, false),
  ('trade_ready', 'Trade Ready', 'Marked cans available for trade', 'trade', '🔄', 'silver', 220, false),
  ('active_trader', 'Active Trader', 'Maintains multiple active trade listings', 'trade', '⚖️', 'gold', 230, false),
  ('barcode_helper', 'Barcode Helper', 'Helped link barcodes to the master catalog', 'community', '📊', 'silver', 310, false),
  ('image_contributor', 'Image Contributor', 'Contributed reference images to the catalog', 'community', '📸', 'silver', 320, false),
  ('master_db_contributor', 'Master DB Contributor', 'Approved contribution to the master database', 'community', '🗄️', 'gold', 330, false),
  ('feedback_helper', 'Feedback Helper', 'Submitted feedback to improve CanTrove', 'community', '💬', 'bronze', 340, false),
  ('beta_tester', 'Beta Tester', 'Early beta tester and bug hunter', 'special', '🧪', 'special', 410, true),
  ('founder', 'Founder', 'CanTrove founder and early supporter', 'special', '👑', 'special', 420, true),
  ('community_contributor', 'Community Contributor', 'Outstanding community contributor', 'special', '⭐', 'special', 430, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  emoji = excluded.emoji,
  tier = excluded.tier,
  sort_order = excluded.sort_order,
  is_manual_only = excluded.is_manual_only;

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.badge_events enable row level security;

drop policy if exists "Anyone can read badges" on public.badges;
create policy "Anyone can read badges"
  on public.badges for select
  to authenticated, anon
  using (true);

drop policy if exists "Users read own badges" on public.user_badges;
create policy "Users read own badges"
  on public.user_badges for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Public badges for public profiles" on public.user_badges;
create policy "Public badges for public profiles"
  on public.user_badges for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.profiles p
      where p.id = user_badges.user_id
        and p.is_public_profile = true
        and p.username is not null
    )
  );

drop policy if exists "Users upsert own computed badges" on public.user_badges;
create policy "Users upsert own computed badges"
  on public.user_badges for insert
  to authenticated
  with check (auth.uid() = user_id and source = 'computed');

drop policy if exists "Users update own computed badges" on public.user_badges;
create policy "Users update own computed badges"
  on public.user_badges for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage user badges" on public.user_badges;
create policy "Admins manage user badges"
  on public.user_badges for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Users read own badge events" on public.badge_events;
create policy "Users read own badge events"
  on public.badge_events for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins read badge events" on public.badge_events;
create policy "Admins read badge events"
  on public.badge_events for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "System insert badge events" on public.badge_events;
create policy "System insert badge events"
  on public.badge_events for insert
  to authenticated
  with check (auth.uid() = actor_id or auth.uid() = user_id or public.is_admin_user());

-- ------------------------------------------------------------
-- 7. LEADERBOARD helper (public profiles only)
-- ------------------------------------------------------------

create or replace function public.get_public_leaderboard(
  p_metric text,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  username text,
  public_display_name text,
  avatar_url text,
  featured_badge_id text,
  score numeric,
  rank bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_metric = 'cans' then
    return query
    select
      p.id,
      p.username,
      p.public_display_name,
      p.avatar_url,
      p.featured_badge_id,
      coalesce(sum(c.quantity) filter (where not c.is_wishlist), 0)::numeric as score,
      rank() over (order by coalesce(sum(c.quantity) filter (where not c.is_wishlist), 0) desc) as rank
    from public.profiles p
    left join public.cans c on c.user_id = p.id
    where p.is_public_profile = true and p.username is not null
    group by p.id, p.username, p.public_display_name, p.avatar_url, p.featured_badge_id
    order by score desc
    limit p_limit;

  elsif p_metric = 'badges' then
    return query
    select
      p.id,
      p.username,
      p.public_display_name,
      p.avatar_url,
      p.featured_badge_id,
      count(ub.id)::numeric as score,
      rank() over (order by count(ub.id) desc) as rank
    from public.profiles p
    left join public.user_badges ub on ub.user_id = p.id
    where p.is_public_profile = true and p.username is not null
    group by p.id, p.username, p.public_display_name, p.avatar_url, p.featured_badge_id
    order by score desc
    limit p_limit;

  elsif p_metric = 'trades' then
    return query
    select
      p.id,
      p.username,
      p.public_display_name,
      p.avatar_url,
      p.featured_badge_id,
      count(tl.id)::numeric as score,
      rank() over (order by count(tl.id) desc) as rank
    from public.profiles p
    left join public.trade_listings tl
      on tl.user_id = p.id and tl.trade_status = 'available'
    where p.is_public_profile = true and p.username is not null
    group by p.id, p.username, p.public_display_name, p.avatar_url, p.featured_badge_id
    order by score desc
    limit p_limit;

  elsif p_metric = 'contributions' then
    return query
    select
      p.id,
      p.username,
      p.public_display_name,
      p.avatar_url,
      p.featured_badge_id,
      count(ps.id) filter (where ps.status = 'approved')::numeric as score,
      rank() over (order by count(ps.id) filter (where ps.status = 'approved') desc) as rank
    from public.profiles p
    left join public.pending_can_suggestions ps on ps.submitted_by = p.id
    where p.is_public_profile = true and p.username is not null
    group by p.id, p.username, p.public_display_name, p.avatar_url, p.featured_badge_id
    order by score desc
    limit p_limit;

  else
    -- completion % placeholder — computed client-side when master data unavailable in SQL
    return query
    select
      p.id,
      p.username,
      p.public_display_name,
      p.avatar_url,
      p.featured_badge_id,
      0::numeric as score,
      rank() over (order by p.created_at) as rank
    from public.profiles p
    where p.is_public_profile = true and p.username is not null
    order by p.created_at
    limit p_limit;
  end if;
end;
$$;

grant execute on function public.get_public_leaderboard(text, integer) to anon, authenticated;

-- Extend public profile RPC
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
  featured_badge_id text,
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
    case when p.is_public_profile then p.featured_badge_id else null end,
    p.created_at
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_profile_by_username(text) to anon, authenticated;
