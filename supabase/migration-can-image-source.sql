-- Can image source tracking (user / master_database / open_food_facts / placeholder)

alter table public.cans
  add column if not exists image_source text default 'placeholder' not null
    check (image_source in ('user', 'master_database', 'open_food_facts', 'placeholder')),
  add column if not exists user_image_url text,
  add column if not exists master_image_url text,
  add column if not exists off_image_url text;

comment on column public.cans.image_source is 'Active image priority source';
comment on column public.cans.user_image_url is 'User-uploaded photo (kept when switching sources)';
comment on column public.cans.master_image_url is 'Verified master database product image';
comment on column public.cans.off_image_url is 'Open Food Facts front product image';
