-- Pending suggestions: attach scanned barcode to existing master can
-- Safe to re-run

alter table public.pending_can_suggestions
  add column if not exists suggested_master_can_id uuid references public.master_cans(id) on delete set null,
  add column if not exists suggestion_type text default 'new_master' not null
    check (suggestion_type in ('new_master', 'attach_barcode'));

create index if not exists pending_suggestions_attach_barcode_idx
  on public.pending_can_suggestions (suggested_master_can_id)
  where suggestion_type = 'attach_barcode' and status = 'pending';

comment on column public.pending_can_suggestions.suggested_master_can_id is
  'When suggestion_type is attach_barcode, admin approves linking barcode to this master can';

comment on column public.pending_can_suggestions.suggestion_type is
  'new_master = create/link new catalog entry; attach_barcode = link scan barcode to existing master';
