-- CanTrove — Master reference image review status
-- Run after migration-image-quality-workflow.sql (or migration-master-reference-images.sql)

alter table public.master_cans
  add column if not exists reference_image_status text not null default 'placeholder',
  add column if not exists off_preview_image_url text;

comment on column public.master_cans.reference_image_status is
  'pending | approved | rejected | placeholder — OFF images must stay pending until admin approves';
comment on column public.master_cans.off_preview_image_url is
  'Open Food Facts lookup preview — never shown in collection grids';

-- Migrate legacy reference_image_approved boolean if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'master_cans'
      and column_name = 'reference_image_approved'
  ) then
    update public.master_cans
    set reference_image_status = case
      when reference_image_approved = true then 'approved'
      when image_source = 'open_food_facts' and coalesce(reference_image_url, image_url) is not null then 'pending'
      else 'placeholder'
    end
    where reference_image_status = 'placeholder';

    update public.master_cans
    set
      off_preview_image_url = coalesce(reference_image_url, image_url),
      reference_image_url = null,
      image_url = null
    where image_source = 'open_food_facts'
      and reference_image_status <> 'approved';
  else
    update public.master_cans
    set reference_image_status = 'approved'
    where coalesce(reference_image_url, image_url) is not null
      and coalesce(image_source, 'manual') in ('official_site', 'manual', 'seed');

    update public.master_cans
    set reference_image_status = 'pending'
    where image_source = 'open_food_facts'
      and coalesce(reference_image_url, image_url) is not null;

    update public.master_cans
    set
      off_preview_image_url = coalesce(reference_image_url, image_url),
      reference_image_url = null,
      image_url = null
    where image_source = 'open_food_facts'
      and reference_image_status = 'pending';
  end if;
end $$;

alter table public.master_cans
  drop constraint if exists master_cans_reference_image_status_check;

alter table public.master_cans
  add constraint master_cans_reference_image_status_check
  check (reference_image_status in ('pending', 'approved', 'rejected', 'placeholder'));
