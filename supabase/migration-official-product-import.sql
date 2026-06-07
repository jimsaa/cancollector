-- CanCollector — Official product import (scraper → pending → master_cans)
-- Run after migration-master-can-approval.sql

-- ------------------------------------------------------------
-- 1. MASTER_CANS — provenance + category
-- ------------------------------------------------------------

alter table public.master_cans
  add column if not exists source text,
  add column if not exists source_url text,
  add column if not exists category text;

comment on column public.master_cans.source is 'e.g. official_site, manual, seed';
comment on column public.master_cans.source_url is 'External product page URL (not re-hosted)';
comment on column public.master_cans.category is 'Product line / category from source site';

create unique index if not exists master_cans_source_url_unique_idx
  on public.master_cans (source_url)
  where source_url is not null;

-- ------------------------------------------------------------
-- 2. PENDING_CAN_SUGGESTIONS — official imports without barcode
-- ------------------------------------------------------------

alter table public.pending_can_suggestions
  alter column barcode drop not null;

alter table public.pending_can_suggestions
  add column if not exists brand text,
  add column if not exists category text,
  add column if not exists flavor text,
  add column if not exists variant_name text,
  add column if not exists volume text,
  add column if not exists country text,
  add column if not exists product_page_url text,
  add column if not exists source_url text;

alter table public.pending_can_suggestions
  drop constraint if exists pending_can_suggestions_source_check;

alter table public.pending_can_suggestions
  add constraint pending_can_suggestions_source_check
  check (source in (
    'open_food_facts',
    'user_scan',
    'manual',
    'master_database',
    'official_site'
  ));

create unique index if not exists pending_suggestions_product_page_pending_idx
  on public.pending_can_suggestions (product_page_url)
  where status = 'pending' and product_page_url is not null;

create index if not exists pending_suggestions_source_idx
  on public.pending_can_suggestions (source, status, created_at desc);

comment on column public.pending_can_suggestions.product_page_url is 'Official product page for dedupe';
comment on column public.pending_can_suggestions.source_url is 'Same as product_page_url or canonical source link';
