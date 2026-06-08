-- CanCollector — detailed collector metadata on user cans (idempotent).
-- Run in Supabase SQL Editor after base cans migration.

-- Opening status (replaces simple opened checkbox in UI; opened boolean kept for compat)
alter table public.cans
  add column if not exists opening_status text default 'sealed' not null
    check (opening_status in (
      'sealed',
      'opened_top',
      'opened_bottom',
      'opened_tab_intact',
      'opened_unknown'
    ));

-- Purchase / provenance
alter table public.cans
  add column if not exists purchase_country text,
  add column if not exists purchase_city text,
  add column if not exists purchase_store text;

-- Privacy / publishing
alter table public.cans
  add column if not exists is_public boolean default false not null,
  add column if not exists show_on_public_profile boolean default false not null;

-- Trade details on the can record
alter table public.cans
  add column if not exists trade_status text default 'not_for_trade' not null
    check (trade_status in ('not_for_trade', 'available', 'reserved', 'traded')),
  add column if not exists trade_price numeric(12, 2),
  add column if not exists trade_currency text
    check (trade_currency is null or trade_currency in (
      'USD', 'EUR', 'GBP', 'SEK', 'NOK', 'DKK', 'CAD', 'AUD', 'OTHER'
    )),
  add column if not exists trade_note text;

-- Condition
alter table public.cans
  add column if not exists condition_grade text default 'unknown' not null
    check (condition_grade in ('mint', 'excellent', 'good', 'fair', 'damaged', 'unknown')),
  add column if not exists condition_notes text;

-- Backfill from legacy columns
update public.cans
set opening_status = case
  when coalesce(opened, false) then 'opened_unknown'
  else 'sealed'
end
where opening_status = 'sealed' and coalesce(opened, false);

update public.cans
set trade_status = case
  when coalesce(available_for_trade, false) then 'available'
  else 'not_for_trade'
end
where trade_status = 'not_for_trade' and coalesce(available_for_trade, false);

update public.cans
set opened = (opening_status <> 'sealed')
where opened is distinct from (opening_status <> 'sealed');

update public.cans
set available_for_trade = (trade_status in ('available', 'reserved'))
where available_for_trade is distinct from (trade_status in ('available', 'reserved'));

create index if not exists cans_trade_status_idx
  on public.cans (user_id, trade_status)
  where trade_status in ('available', 'reserved');

create index if not exists cans_public_profile_idx
  on public.cans (user_id, show_on_public_profile)
  where show_on_public_profile = true;

comment on column public.cans.opening_status is 'Collector opening method: sealed, top, bottom, tab intact, unknown';
comment on column public.cans.condition_grade is 'Collector condition grade';
comment on column public.cans.trade_status is 'Per-can trade lifecycle status';
