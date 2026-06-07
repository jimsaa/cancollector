-- Ensure all columns required by Add Can cloud save exist (idempotent).
-- Run in Supabase SQL Editor if saves fail with missing-column errors.
-- Safe to run even when public.master_cans does not exist yet.

-- Image source tracking
alter table public.cans
  add column if not exists image_source text default 'placeholder' not null
    check (image_source in ('user', 'master_database', 'open_food_facts', 'placeholder')),
  add column if not exists user_image_url text,
  add column if not exists master_image_url text,
  add column if not exists off_image_url text;

-- Master database link (FK only when master_cans table exists)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'master_cans'
  ) then
    alter table public.cans
      add column if not exists master_can_id uuid references public.master_cans(id) on delete set null;
  else
    alter table public.cans
      add column if not exists master_can_id uuid;
    raise notice 'master_cans not found — added master_can_id without FK. Run migration-master-cans.sql when ready.';
  end if;
end $$;

create index if not exists cans_master_can_id_idx
  on public.cans (master_can_id)
  where master_can_id is not null;

-- Trade / wishlist flag
alter table public.cans
  add column if not exists wanted boolean default false not null;

create index if not exists cans_wanted_user_idx
  on public.cans (user_id, wanted)
  where wanted = true;

-- RLS: authenticated users insert own cans (re-apply safely)
alter table public.cans enable row level security;

drop policy if exists "Users can insert own cans" on public.cans;
create policy "Users can insert own cans"
  on public.cans for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own cans" on public.cans;
create policy "Users can view own cans"
  on public.cans for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own cans" on public.cans;
create policy "Users can update own cans"
  on public.cans for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own cans" on public.cans;
create policy "Users can delete own cans"
  on public.cans for delete
  to authenticated
  using (auth.uid() = user_id);
