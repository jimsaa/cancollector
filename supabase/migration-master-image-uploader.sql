-- CanTrove — Master image uploader: admin_uploaded image_source
-- Safe to re-run. Run after migration-image-quality-workflow.sql

alter table public.master_cans
  drop constraint if exists master_cans_image_source_check;

alter table public.master_cans
  add constraint master_cans_image_source_check
  check (
    image_source is null
    or image_source in (
      'official_site',
      'manual',
      'admin_uploaded',
      'seed',
      'open_food_facts',
      'placeholder'
    )
  );

comment on column public.master_cans.image_source is
  'Provenance of reference_image_url: official_site, manual, admin_uploaded, seed, open_food_facts, placeholder';

-- Treat admin-uploaded references as approved catalog art
update public.master_cans
set reference_image_approved = true
where image_source = 'admin_uploaded'
  and reference_image_url is not null
  and reference_image_approved = false;
