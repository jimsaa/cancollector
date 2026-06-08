-- CanTrove — Image quality workflow: approved master references + image_source values
-- Run after migration-master-reference-images.sql and migration-can-save-columns.sql

-- Master catalog: admin-approved reference images
alter table public.master_cans
  add column if not exists reference_image_approved boolean not null default false;

comment on column public.master_cans.reference_image_approved is
  'When true, reference_image_url is suitable for collection display';
comment on column public.master_cans.image_source is
  'Provenance of reference_image_url (reference_image_source): official_site, manual, seed, open_food_facts, placeholder';

-- Backfill: approve existing official/manual/seed references
update public.master_cans
set reference_image_approved = true
where reference_image_url is not null
  and coalesce(image_source, 'manual') in ('official_site', 'manual', 'seed');

-- User cans: expand image_source check constraint
alter table public.cans
  drop constraint if exists cans_image_source_check;

alter table public.cans
  add constraint cans_image_source_check
  check (
    image_source is null
    or image_source in (
      'user_uploaded',
      'master_reference',
      'default_placeholder',
      'open_food_facts_unverified',
      -- legacy values (read paths normalize these)
      'user',
      'master_database',
      'placeholder',
      'open_food_facts'
    )
  );

-- Migrate legacy user-can image_source values
update public.cans set image_source = 'user_uploaded' where image_source = 'user';
update public.cans set image_source = 'master_reference' where image_source = 'master_database';
update public.cans set image_source = 'default_placeholder' where image_source = 'placeholder';
update public.cans set image_source = 'open_food_facts_unverified' where image_source = 'open_food_facts';
