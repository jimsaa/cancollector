-- Can Collector — Trade matching foundation
-- Future-ready structure for matching collectors (no messaging yet)
-- Safe to re-run

-- ------------------------------------------------------------
-- 1. WANTED FLAG ON USER CANS
-- ------------------------------------------------------------

alter table public.cans
  add column if not exists wanted boolean default false not null;

create index if not exists cans_available_for_trade_user_idx
  on public.cans (user_id, available_for_trade)
  where available_for_trade = true and is_wishlist = false;

create index if not exists cans_wanted_user_idx
  on public.cans (user_id, wanted)
  where wanted = true;

-- Backfill wanted from wishlist
update public.cans
set wanted = true
where is_wishlist = true
  and (wishlist_status is null or wishlist_status = 'wanted')
  and wanted = false;

-- ------------------------------------------------------------
-- 2. TRADE PROFILES — per-collector matching settings
-- ------------------------------------------------------------

create table if not exists public.trade_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  matching_enabled boolean default true not null,
  public_trade_list boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.trade_profiles is 'Collector trade/matching preferences';

drop trigger if exists trade_profiles_set_updated_at on public.trade_profiles;
create trigger trade_profiles_set_updated_at
  before update on public.trade_profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 3. TRADE LISTINGS — cans offered for trade (denormalized for matching)
-- ------------------------------------------------------------

create table if not exists public.trade_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  can_id uuid references public.cans(id) on delete cascade not null,
  master_can_id uuid references public.master_cans(id) on delete set null,
  barcode text,
  brand text,
  product_name text,
  flavor text,
  volume text,
  region text,
  quantity integer default 1 not null check (quantity >= 1),
  opened boolean default false not null,
  active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (can_id)
);

create index if not exists trade_listings_user_active_idx
  on public.trade_listings (user_id)
  where active = true;

create index if not exists trade_listings_barcode_idx
  on public.trade_listings (barcode)
  where active = true and barcode is not null;

create index if not exists trade_listings_master_can_idx
  on public.trade_listings (master_can_id)
  where active = true and master_can_id is not null;

drop trigger if exists trade_listings_set_updated_at on public.trade_listings;
create trigger trade_listings_set_updated_at
  before update on public.trade_listings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. TRADE WANTS — cans collectors are seeking
-- ------------------------------------------------------------

create table if not exists public.trade_wants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  can_id uuid references public.cans(id) on delete cascade,
  master_can_id uuid references public.master_cans(id) on delete set null,
  barcode text,
  brand text,
  product_name text,
  flavor text,
  volume text,
  region text,
  priority integer default 0 not null,
  active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index if not exists trade_wants_can_id_unique_idx
  on public.trade_wants (can_id)
  where can_id is not null;

create index if not exists trade_wants_user_active_idx
  on public.trade_wants (user_id)
  where active = true;

create index if not exists trade_wants_barcode_idx
  on public.trade_wants (barcode)
  where active = true and barcode is not null;

create index if not exists trade_wants_master_can_idx
  on public.trade_wants (master_can_id)
  where active = true and master_can_id is not null;

drop trigger if exists trade_wants_set_updated_at on public.trade_wants;
create trigger trade_wants_set_updated_at
  before update on public.trade_wants
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. TRADE MATCH CANDIDATES — future matching pipeline (no messaging)
-- ------------------------------------------------------------

create table if not exists public.trade_match_candidates (
  id uuid primary key default gen_random_uuid(),
  seeker_user_id uuid references auth.users(id) on delete cascade not null,
  offerer_user_id uuid references auth.users(id) on delete cascade not null,
  want_id uuid references public.trade_wants(id) on delete cascade not null,
  listing_id uuid references public.trade_listings(id) on delete cascade not null,
  match_type text not null
    check (match_type in ('barcode', 'master_can', 'brand_flavor')),
  match_score numeric(5, 2) default 100 not null,
  status text default 'suggested' not null
    check (status in ('suggested', 'viewed', 'dismissed', 'saved')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (seeker_user_id, offerer_user_id, want_id, listing_id)
);

create index if not exists trade_match_seeker_idx
  on public.trade_match_candidates (seeker_user_id, status);

create index if not exists trade_match_offerer_idx
  on public.trade_match_candidates (offerer_user_id, status);

drop trigger if exists trade_match_candidates_set_updated_at on public.trade_match_candidates;
create trigger trade_match_candidates_set_updated_at
  before update on public.trade_match_candidates
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.trade_profiles enable row level security;
alter table public.trade_listings enable row level security;
alter table public.trade_wants enable row level security;
alter table public.trade_match_candidates enable row level security;

-- trade_profiles
drop policy if exists "Users manage own trade profile" on public.trade_profiles;
create policy "Users manage own trade profile"
  on public.trade_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Collectors can view matching-enabled profiles" on public.trade_profiles;
create policy "Collectors can view matching-enabled profiles"
  on public.trade_profiles for select
  to authenticated
  using (matching_enabled = true);

-- trade_listings
drop policy if exists "Users manage own trade listings" on public.trade_listings;
create policy "Users manage own trade listings"
  on public.trade_listings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Collectors can view active trade listings" on public.trade_listings;
create policy "Collectors can view active trade listings"
  on public.trade_listings for select
  to authenticated
  using (
    active = true
    and exists (
      select 1 from public.trade_profiles tp
      where tp.user_id = trade_listings.user_id
        and tp.matching_enabled = true
        and tp.public_trade_list = true
    )
  );

-- trade_wants
drop policy if exists "Users manage own trade wants" on public.trade_wants;
create policy "Users manage own trade wants"
  on public.trade_wants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Collectors can view active trade wants for matching" on public.trade_wants;
create policy "Collectors can view active trade wants for matching"
  on public.trade_wants for select
  to authenticated
  using (
    active = true
    and exists (
      select 1 from public.trade_profiles tp
      where tp.user_id = trade_wants.user_id
        and tp.matching_enabled = true
    )
  );

-- trade_match_candidates
drop policy if exists "Users view own match candidates" on public.trade_match_candidates;
create policy "Users view own match candidates"
  on public.trade_match_candidates for select
  using (auth.uid() = seeker_user_id or auth.uid() = offerer_user_id);

drop policy if exists "Users update own match candidates" on public.trade_match_candidates;
create policy "Users update own match candidates"
  on public.trade_match_candidates for update
  using (auth.uid() = seeker_user_id or auth.uid() = offerer_user_id);

drop policy if exists "Users insert own match candidates" on public.trade_match_candidates;
create policy "Users insert own match candidates"
  on public.trade_match_candidates for insert
  with check (auth.uid() = seeker_user_id or auth.uid() = offerer_user_id);

-- ------------------------------------------------------------
-- 7. BACKFILL TRADE PROFILES + SYNC FROM EXISTING CANS
-- ------------------------------------------------------------

insert into public.trade_profiles (user_id)
select id from auth.users u
where not exists (select 1 from public.trade_profiles tp where tp.user_id = u.id);

insert into public.trade_listings (
  user_id, can_id, master_can_id, barcode, brand, product_name, flavor, volume, region, quantity, opened, active
)
select
  c.user_id, c.id, c.master_can_id, c.barcode, c.brand, c.name, c.flavor, c.volume, c.country, c.quantity, c.opened, true
from public.cans c
where c.available_for_trade = true
  and c.is_wishlist = false
  and not exists (select 1 from public.trade_listings tl where tl.can_id = c.id)
on conflict (can_id) do nothing;

insert into public.trade_wants (
  user_id, can_id, master_can_id, barcode, brand, product_name, flavor, volume, region, active
)
select
  c.user_id, c.id, c.master_can_id, c.barcode, c.brand, c.name, c.flavor, c.volume, c.country, true
from public.cans c
where c.wanted = true
  and not exists (
    select 1 from public.trade_wants tw
    where tw.can_id = c.id and tw.user_id = c.user_id
  );
