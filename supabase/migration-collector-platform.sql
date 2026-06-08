-- CanTrove collector platform: user_can_status + master_cans collector fields
-- Safe to re-run

-- ------------------------------------------------------------
-- 1. MASTER_CANS — collection sets, country variants, collector summary
-- ------------------------------------------------------------

alter table public.master_cans
  add column if not exists collection_set text,
  add column if not exists base_product_key text,
  add column if not exists variant_country text,
  add column if not exists variant_region text,
  add column if not exists language_code text,
  add column if not exists release_date date,
  add column if not exists discontinued_date date,
  add column if not exists catalog_date date,
  add column if not exists collector_summary text;

comment on column public.master_cans.collection_set is 'Collector set grouping: Ultra, Java, Juice, etc.';
comment on column public.master_cans.base_product_key is 'Groups country variants of the same product';
comment on column public.master_cans.variant_country is 'Country-specific variant label (US, Sweden, etc.)';
comment on column public.master_cans.collector_summary is 'Curated collector-facing product description';

create index if not exists master_cans_collection_set_idx
  on public.master_cans (collection_set)
  where collection_set is not null;

create index if not exists master_cans_base_product_key_idx
  on public.master_cans (base_product_key)
  where base_product_key is not null;

-- ------------------------------------------------------------
-- 2. USER_CAN_STATUS — Got / Want / Need per master can
-- ------------------------------------------------------------

create table if not exists public.user_can_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  master_can_id uuid not null references public.master_cans(id) on delete cascade,
  status text not null check (status in ('got', 'want', 'need')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, master_can_id)
);

create index if not exists user_can_status_user_idx
  on public.user_can_status (user_id);

create index if not exists user_can_status_master_idx
  on public.user_can_status (master_can_id);

create index if not exists user_can_status_status_idx
  on public.user_can_status (status);

drop trigger if exists user_can_status_set_updated_at on public.user_can_status;
create trigger user_can_status_set_updated_at
  before update on public.user_can_status
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 3. RLS — user_can_status
-- ------------------------------------------------------------

alter table public.user_can_status enable row level security;

drop policy if exists "Users manage own can status" on public.user_can_status;
create policy "Users manage own can status"
  on public.user_can_status for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Anyone can read can status counts" on public.user_can_status;
create policy "Anyone can read can status counts"
  on public.user_can_status for select
  to authenticated, anon
  using (true);

-- ------------------------------------------------------------
-- 4. ADMIN UPDATE on master_cans (uses profiles.role, not legacy is_admin)
-- ------------------------------------------------------------

drop policy if exists "Admins can update master cans" on public.master_cans;
create policy "Admins can update master cans"
  on public.master_cans for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ------------------------------------------------------------
-- 5. COMMUNITY COUNTS VIEW (optional helper)
-- ------------------------------------------------------------

create or replace view public.master_can_status_counts as
select
  master_can_id,
  count(*) filter (where status = 'got') as got_count,
  count(*) filter (where status = 'want') as want_count,
  count(*) filter (where status = 'need') as need_count
from public.user_can_status
group by master_can_id;
