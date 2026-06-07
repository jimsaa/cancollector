-- Master Can approval workflow — roles + RLS
-- Run after migration-master-can-v1.sql

-- ------------------------------------------------------------
-- 1. PROFILES.ROLE (replaces is_admin flag)
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists role text default 'user' not null
    check (role in ('user', 'admin'));

update public.profiles
set role = 'admin'
where role = 'user' and is_admin = true;

comment on column public.profiles.role is 'user or admin — only admins manage master database';

-- ------------------------------------------------------------
-- 2. HELPER — admin check for RLS
-- ------------------------------------------------------------

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 3. MASTER_CANS — read approved, admin-only writes
-- ------------------------------------------------------------

drop policy if exists "Anyone can view active master cans" on public.master_cans;
drop policy if exists "Authenticated users can view all master cans" on public.master_cans;
drop policy if exists "Admins can insert master cans" on public.master_cans;
drop policy if exists "Admins can update master cans" on public.master_cans;

create policy "Authenticated users read active master cans"
  on public.master_cans for select
  to authenticated
  using (active = true);

create policy "Admins insert master cans"
  on public.master_cans for insert
  to authenticated
  with check (public.is_admin_user());

create policy "Admins update master cans"
  on public.master_cans for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "Admins delete master cans"
  on public.master_cans for delete
  to authenticated
  using (public.is_admin_user());

-- ------------------------------------------------------------
-- 4. PENDING_CAN_SUGGESTIONS — users submit, admins moderate
-- ------------------------------------------------------------

drop policy if exists "Anyone can submit pending suggestions" on public.pending_can_suggestions;
drop policy if exists "Admins can view pending suggestions" on public.pending_can_suggestions;
drop policy if exists "Admins can update pending suggestions" on public.pending_can_suggestions;

create policy "Users create pending suggestions"
  on public.pending_can_suggestions for insert
  to authenticated
  with check (
    status = 'pending'
    and (submitted_by = auth.uid() or submitted_by is null)
  );

create policy "Admins read pending suggestions"
  on public.pending_can_suggestions for select
  to authenticated
  using (public.is_admin_user());

create policy "Admins update pending suggestions"
  on public.pending_can_suggestions for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Users cannot approve their own suggestions via client (no user update policy)
