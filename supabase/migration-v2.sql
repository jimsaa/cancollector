-- Can Collector v2 migration (run on existing Supabase projects)
-- Adds wishlist, country variant support

alter table public.cans add column if not exists country_variant text;
alter table public.cans add column if not exists is_wishlist boolean default false not null;
alter table public.cans add column if not exists wishlist_status text
  check (wishlist_status is null or wishlist_status in ('wanted', 'missing'));
