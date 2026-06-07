-- Can Collector — Detailed trade listings (images, condition, YouTube, location)
-- Extends trade_listings from migration-trade-matching.sql
-- Safe to re-run

-- ------------------------------------------------------------
-- 1. DETAIL COLUMNS ON TRADE_LISTINGS
-- ------------------------------------------------------------

alter table public.trade_listings
  add column if not exists title text default '' not null,
  add column if not exists description text default '' not null,
  add column if not exists condition text default 'unknown' not null
    check (condition in ('mint', 'excellent', 'good', 'damaged', 'opened', 'unknown')),
  add column if not exists trade_status text default 'available' not null
    check (trade_status in ('available', 'reserved', 'completed', 'hidden')),
  add column if not exists asking_for text default '' not null,
  add column if not exists location_country text,
  add column if not exists location_city text,
  add column if not exists shipping_available boolean default false not null,
  add column if not exists local_pickup_available boolean default false not null,
  add column if not exists extra_image_urls jsonb default '[]'::jsonb not null,
  add column if not exists youtube_url text;

create index if not exists trade_listings_status_idx
  on public.trade_listings (trade_status)
  where trade_status = 'available';

-- Backfill title from product_name
update public.trade_listings
set title = coalesce(nullif(product_name, ''), 'Trade listing')
where title = '' or title is null;

-- Sync trade_status from active flag for legacy rows
update public.trade_listings
set trade_status = case when active then 'available' else 'hidden' end
where trade_status is null;

-- ------------------------------------------------------------
-- 2. TRADE IMAGES STORAGE BUCKET
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('trade-images', 'trade-images', true)
on conflict (id) do nothing;

drop policy if exists "Users upload own trade images" on storage.objects;
create policy "Users upload own trade images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trade-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own trade images" on storage.objects;
create policy "Users update own trade images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'trade-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own trade images" on storage.objects;
create policy "Users delete own trade images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trade-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view trade images" on storage.objects;
create policy "Anyone can view trade images"
  on storage.objects for select
  using (bucket_id = 'trade-images');

-- ------------------------------------------------------------
-- 3. PUBLIC READ FOR AVAILABLE LISTINGS
-- ------------------------------------------------------------

drop policy if exists "Collectors can view active trade listings" on public.trade_listings;
create policy "Collectors can view active trade listings"
  on public.trade_listings for select
  to authenticated
  using (
    trade_status = 'available'
    and exists (
      select 1 from public.trade_profiles tp
      where tp.user_id = trade_listings.user_id
        and tp.matching_enabled = true
        and tp.public_trade_list = true
    )
  );

-- Anonymous/public read for available listings (future marketplace)
drop policy if exists "Public can view available trade listings" on public.trade_listings;
create policy "Public can view available trade listings"
  on public.trade_listings for select
  using (trade_status = 'available');
