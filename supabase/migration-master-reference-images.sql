-- CanCollector — Master can reference images (separate from user photos)
-- Run after migration-official-product-import.sql

alter table public.master_cans
  add column if not exists reference_image_url text,
  add column if not exists image_source text;

comment on column public.master_cans.reference_image_url is
  'External catalog/reference image URL — not re-hosted by CanCollector';
comment on column public.master_cans.image_source is
  'Provenance of reference_image_url: official_site, manual, seed, open_food_facts, placeholder';

-- Backfill from legacy image_url column
update public.master_cans
set
  reference_image_url = coalesce(reference_image_url, image_url),
  image_source = coalesce(image_source, case when image_url is not null then 'manual' else 'placeholder' end)
where reference_image_url is null or image_source is null;

-- Keep image_url in sync for older clients reading that column
update public.master_cans
set image_url = reference_image_url
where reference_image_url is not null
  and (image_url is distinct from reference_image_url);

alter table public.master_cans
  drop constraint if exists master_cans_image_source_check;

alter table public.master_cans
  add constraint master_cans_image_source_check
  check (
    image_source is null
    or image_source in ('official_site', 'manual', 'seed', 'open_food_facts', 'placeholder')
  );
