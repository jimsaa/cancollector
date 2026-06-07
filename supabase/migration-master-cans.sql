-- Can Collector — Global master can database
-- Safe to re-run on new or existing projects

-- ------------------------------------------------------------
-- 1. MASTER_CANS TABLE
-- ------------------------------------------------------------

create table if not exists public.master_cans (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  product_name text not null,
  flavor text,
  volume text,
  region text,
  release_year integer,
  image_url text,
  barcode text,
  rarity text default 'unknown' not null
    check (rarity in ('common', 'uncommon', 'rare', 'unknown')),
  active boolean default true not null,
  discontinued boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.master_cans is 'Global reference database of energy drink cans';

create unique index if not exists master_cans_barcode_unique_idx
  on public.master_cans (barcode)
  where barcode is not null;

create index if not exists master_cans_brand_idx
  on public.master_cans (brand);

create index if not exists master_cans_active_idx
  on public.master_cans (active)
  where active = true;

-- ------------------------------------------------------------
-- 2. LINK USER CANS TO MASTER DATABASE
-- ------------------------------------------------------------

alter table public.cans
  add column if not exists master_can_id uuid references public.master_cans(id) on delete set null;

create index if not exists cans_master_can_id_idx
  on public.cans (master_can_id)
  where master_can_id is not null;

-- ------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER
-- ------------------------------------------------------------

drop trigger if exists master_cans_set_updated_at on public.master_cans;
create trigger master_cans_set_updated_at
  before update on public.master_cans
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — master_cans (read-only for users)
-- ------------------------------------------------------------

alter table public.master_cans enable row level security;

drop policy if exists "Anyone can view active master cans" on public.master_cans;
create policy "Anyone can view active master cans"
  on public.master_cans for select
  using (active = true);

drop policy if exists "Authenticated users can view all master cans" on public.master_cans;
create policy "Authenticated users can view all master cans"
  on public.master_cans for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- 5. SEED DATA (idempotent via barcode)
-- ------------------------------------------------------------

insert into public.master_cans (id, brand, product_name, flavor, volume, region, release_year, barcode, rarity, active, discontinued)
values
  ('11111111-0001-4000-8000-000000000001', 'Monster', 'Monster Energy Original', 'Classic', '500ml', 'EU', 2018, '9900100000001', 'common', true, false),
  ('11111111-0001-4000-8000-000000000002', 'Monster', 'Monster Ultra Zero', 'Citrus', '500ml', 'US', 2020, '9900100000002', 'common', true, false),
  ('11111111-0001-4000-8000-000000000003', 'Monster', 'Monster Pipeline Punch', 'Tropical Punch', '473ml', 'US', 2019, '9900100000003', 'uncommon', true, false),
  ('11111111-0001-4000-8000-000000000004', 'Monster', 'Monster Mango Loco', 'Mango', '500ml', 'UK', 2021, '9900100000004', 'uncommon', true, false),
  ('11111111-0001-4000-8000-000000000005', 'Monster', 'Monster Ripper', 'Juice Blend', '500ml', 'EU', 2016, '9900100000005', 'rare', false, true),
  ('11111111-0003-4000-8000-000000000006', 'Red Bull', 'Red Bull Energy Drink', 'Original', '250ml', 'EU', 2015, '9900200000006', 'common', true, false),
  ('11111111-0003-4000-8000-000000000007', 'Red Bull', 'Red Bull Sugarfree', 'Original', '250ml', 'US', 2017, '9900200000007', 'common', true, false),
  ('11111111-0003-4000-8000-000000000008', 'Red Bull', 'Red Bull Summer Edition', 'Curuba Elderflower', '250ml', 'SE', 2023, '9900200000008', 'rare', true, false),
  ('11111111-0003-4000-8000-000000000009', 'Red Bull', 'Red Bull Cola', 'Cola', '250ml', 'EU', 2014, '9900200000009', 'uncommon', false, true),
  ('11111111-0002-4000-8000-000000000010', 'Rockstar', 'Rockstar Original', 'Original', '500ml', 'EU', 2018, '9900300000010', 'common', true, false),
  ('11111111-0002-4000-8000-000000000011', 'Rockstar', 'Rockstar Punched', 'Fruit Punch', '500ml', 'US', 2019, '9900300000011', 'common', true, false),
  ('11111111-0002-4000-8000-000000000012', 'Rockstar', 'Rockstar Recovery', 'Orange', '458ml', 'US', 2020, '9900300000012', 'uncommon', true, false),
  ('11111111-0002-4000-8000-000000000013', 'Rockstar', 'Rockstar Boom Strawberry', 'Strawberry', '473ml', 'CA', 2018, '9900300000013', 'rare', true, false),
  ('11111111-0005-4000-8000-000000000014', 'Nocco', 'NOCCO Caribbean', 'Caribbean', '330ml', 'SE', 2020, '9900400000014', 'common', true, false),
  ('11111111-0005-4000-8000-000000000015', 'Nocco', 'NOCCO Miami Strawberry', 'Strawberry', '330ml', 'EU', 2021, '9900400000015', 'common', true, false),
  ('11111111-0005-4000-8000-000000000016', 'Nocco', 'NOCCO Blood Orange', 'Blood Orange', '330ml', 'UK', 2022, '9900400000016', 'uncommon', true, false),
  ('11111111-0005-4000-8000-000000000017', 'Nocco', 'NOCCO Focus Raspberry', 'Raspberry', '330ml', 'SE', 2019, '9900400000017', 'rare', false, true),
  ('11111111-0004-4000-8000-000000000018', 'Celsius', 'Celsius Sparkling Orange', 'Orange', '355ml', 'US', 2020, '9900500000018', 'common', true, false),
  ('11111111-0004-4000-8000-000000000019', 'Celsius', 'Celsius Wild Berry', 'Wild Berry', '355ml', 'US', 2021, '9900500000019', 'common', true, false),
  ('11111111-0004-4000-8000-000000000020', 'Celsius', 'Celsius Kiwi Guava', 'Kiwi Guava', '355ml', 'AU', 2022, '9900500000020', 'uncommon', true, false),
  ('11111111-0004-4000-8000-000000000021', 'Celsius', 'Celsius Arctic Vibe', 'Frozen Berry', '355ml', 'EU', 2023, '9900500000021', 'rare', true, false),
  ('11111111-0006-4000-8000-000000000022', 'Generic Energy', 'Store Brand Original Energy', 'Classic', '250ml', 'EU', 2019, '9900600000022', 'common', true, false),
  ('11111111-0006-4000-8000-000000000023', 'Generic Energy', 'Budget Boost Sugar Free', 'Sugar Free', '330ml', 'UK', 2020, '9900600000023', 'common', true, false),
  ('11111111-0006-4000-8000-000000000024', 'Generic Energy', 'Corner Shop Citrus Rush', 'Lemon Lime', '500ml', 'US', 2021, '9900600000024', 'unknown', true, false),
  ('11111111-0006-4000-8000-000000000025', 'Generic Energy', 'Value Volt Tropical', 'Tropical', '568ml', 'UK', 2017, '9900600000025', 'uncommon', false, true)
on conflict (id) do update set
  brand = excluded.brand,
  product_name = excluded.product_name,
  flavor = excluded.flavor,
  volume = excluded.volume,
  region = excluded.region,
  release_year = excluded.release_year,
  barcode = excluded.barcode,
  rarity = excluded.rarity,
  active = excluded.active,
  discontinued = excluded.discontinued;
