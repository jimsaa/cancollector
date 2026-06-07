-- Can Collector (cancollector) — Supabase schema
-- Run this in the Supabase SQL Editor

create table if not exists public.cans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  barcode text,
  name text,
  brand text,
  flavor text,
  volume text,
  country text,
  image_url text,
  opened boolean default false not null,
  purchase_date date,
  added_date timestamptz default now() not null,
  available_for_trade boolean default false not null,
  notes text,
  rarity text default 'unknown' not null check (rarity in ('common', 'uncommon', 'rare', 'unknown')),
  quantity integer default 1 not null check (quantity >= 1)
);

create index if not exists cans_user_id_idx on public.cans (user_id);
create index if not exists cans_added_date_idx on public.cans (added_date desc);
create index if not exists cans_available_for_trade_idx on public.cans (available_for_trade) where available_for_trade = true;

alter table public.cans enable row level security;

create policy "Users can view own cans"
  on public.cans for select
  using (auth.uid() = user_id);

create policy "Users can insert own cans"
  on public.cans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cans"
  on public.cans for update
  using (auth.uid() = user_id);

create policy "Users can delete own cans"
  on public.cans for delete
  using (auth.uid() = user_id);

-- Storage bucket for can images
insert into storage.buckets (id, name, public)
values ('can-images', 'can-images', true)
on conflict (id) do nothing;

create policy "Users can upload can images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view can images"
  on storage.objects for select
  using (bucket_id = 'can-images');

create policy "Users can update own can images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own can images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
