-- Master Can Database V1
-- Run after migration-master-cans.sql on existing projects

-- ------------------------------------------------------------
-- 1. MASTER_CANS — align schema with V1 model
-- ------------------------------------------------------------

alter table public.master_cans
  add column if not exists variant_name text,
  add column if not exists country text;

update public.master_cans
set country = coalesce(country, region)
where country is null and region is not null;

comment on column public.master_cans.country is 'Market / origin country code or name';
comment on column public.master_cans.variant_name is 'Regional or limited variant label';

-- ------------------------------------------------------------
-- 2. PENDING_CAN_SUGGESTIONS — auto-learning queue
-- ------------------------------------------------------------

create table if not exists public.pending_can_suggestions (
  id uuid primary key default gen_random_uuid(),
  barcode text not null,
  product_name text,
  image_url text,
  source text not null
    check (source in ('open_food_facts', 'user_scan', 'manual', 'master_database')),
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  status text default 'pending' not null
    check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists pending_suggestions_status_idx
  on public.pending_can_suggestions (status, created_at desc);

create index if not exists pending_suggestions_barcode_idx
  on public.pending_can_suggestions (barcode);

comment on table public.pending_can_suggestions is 'User-submitted barcodes awaiting admin review';

-- ------------------------------------------------------------
-- 3. USER_WISHLIST — master can wanted list
-- ------------------------------------------------------------

create table if not exists public.user_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  master_can_id uuid references public.master_cans(id) on delete cascade not null,
  status text default 'wanted' not null check (status in ('wanted')),
  created_at timestamptz default now() not null,
  unique (user_id, master_can_id)
);

create index if not exists user_wishlist_user_idx
  on public.user_wishlist (user_id);

comment on table public.user_wishlist is 'User wanted items from the global master database';

-- ------------------------------------------------------------
-- 4. ADMIN FLAG ON PROFILES
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean default false not null;

-- ------------------------------------------------------------
-- 5. RLS — pending suggestions
-- ------------------------------------------------------------

alter table public.pending_can_suggestions enable row level security;

drop policy if exists "Anyone can submit pending suggestions" on public.pending_can_suggestions;
create policy "Anyone can submit pending suggestions"
  on public.pending_can_suggestions for insert
  to authenticated, anon
  with check (true);

drop policy if exists "Admins can view pending suggestions" on public.pending_can_suggestions;
create policy "Admins can view pending suggestions"
  on public.pending_can_suggestions for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "Admins can update pending suggestions" on public.pending_can_suggestions;
create policy "Admins can update pending suggestions"
  on public.pending_can_suggestions for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ------------------------------------------------------------
-- 6. RLS — user wishlist
-- ------------------------------------------------------------

alter table public.user_wishlist enable row level security;

drop policy if exists "Users manage own wishlist" on public.user_wishlist;
create policy "Users manage own wishlist"
  on public.user_wishlist for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. RLS — admin master can writes
-- ------------------------------------------------------------

drop policy if exists "Admins can insert master cans" on public.master_cans;
create policy "Admins can insert master cans"
  on public.master_cans for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "Admins can update master cans" on public.master_cans;
create policy "Admins can update master cans"
  on public.master_cans for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
