-- CanTrove — Collector accuracy: SKU/product ID, barcode corrections, match reports
-- Safe to re-run. Run after migration-collector-platform.sql

-- ------------------------------------------------------------
-- 1. MASTER_CANS — SKU, product ID, correction audit
-- ------------------------------------------------------------

alter table public.master_cans
  add column if not exists sku text,
  add column if not exists external_product_id text,
  add column if not exists corrected_by uuid references auth.users(id) on delete set null,
  add column if not exists corrected_at timestamptz;

create index if not exists master_cans_sku_idx
  on public.master_cans (sku)
  where sku is not null;

create index if not exists master_cans_external_product_id_idx
  on public.master_cans (external_product_id)
  where external_product_id is not null;

comment on column public.master_cans.sku is 'Manufacturer / retailer SKU for exact identification';
comment on column public.master_cans.external_product_id is 'Official product page ID (e.g. Monster Energy site)';
comment on column public.master_cans.corrected_by is 'Admin who last corrected barcode/SKU mapping';
comment on column public.master_cans.corrected_at is 'When barcode/SKU was last corrected by admin';

-- ------------------------------------------------------------
-- 2. MATCH_REPORTS — incorrect match feedback from collectors
-- ------------------------------------------------------------

create table if not exists public.match_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  barcode text not null,
  matched_master_can_id uuid references public.master_cans(id) on delete set null,
  suggested_master_can_id uuid references public.master_cans(id) on delete set null,
  off_product_name text,
  comment text,
  status text not null default 'new'
    check (status in ('new', 'approved', 'dismissed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists match_reports_status_idx
  on public.match_reports (status, created_at desc);

create index if not exists match_reports_barcode_idx
  on public.match_reports (barcode);

drop trigger if exists match_reports_set_updated_at on public.match_reports;
create trigger match_reports_set_updated_at
  before update on public.match_reports
  for each row execute function public.set_updated_at();

alter table public.match_reports enable row level security;

drop policy if exists "Users insert own match reports" on public.match_reports;
create policy "Users insert own match reports"
  on public.match_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users view own match reports" on public.match_reports;
create policy "Users view own match reports"
  on public.match_reports for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins view all match reports" on public.match_reports;
create policy "Admins view all match reports"
  on public.match_reports for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins update match reports" on public.match_reports;
create policy "Admins update match reports"
  on public.match_reports for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());
