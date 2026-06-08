-- Master can barcode: nullable for official catalog, partial unique index
-- Safe to re-run on existing projects

-- ------------------------------------------------------------
-- 1. NORMALIZE EMPTY BARCODES TO NULL
-- ------------------------------------------------------------

update public.master_cans
set barcode = null
where barcode is not null and trim(barcode) = '';

update public.pending_can_suggestions
set barcode = null
where barcode is not null and trim(barcode) = '';

-- ------------------------------------------------------------
-- 2. PARTIAL UNIQUE INDEX — real barcodes only
-- ------------------------------------------------------------

drop index if exists public.master_cans_barcode_unique_idx;

create unique index if not exists master_cans_barcode_unique_idx
  on public.master_cans (barcode)
  where barcode is not null and barcode <> '';

-- ------------------------------------------------------------
-- 3. BARCODE SOURCE — how barcode was attached later
-- ------------------------------------------------------------

alter table public.master_cans
  add column if not exists barcode_source text
    check (barcode_source is null or barcode_source in ('user_scan', 'admin_manual'));

comment on column public.master_cans.barcode_source is
  'How barcode was linked after catalog import: user_scan or admin_manual';
