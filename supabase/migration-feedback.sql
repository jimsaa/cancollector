-- CanTrove — In-app feedback (admin dashboard only, no email)
-- Run after migration-master-can-approval.sql (uses public.is_admin_user())

-- ------------------------------------------------------------
-- 1. FEEDBACK TABLE
-- ------------------------------------------------------------

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  display_name text,
  type text not null
    check (type in ('bug', 'feature', 'image_correction', 'trade', 'other')),
  title text not null,
  message text not null,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  current_url text,
  user_agent text,
  screenshot_url text,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'planned', 'fixed', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_status_idx
  on public.feedback (status, created_at desc);

create index if not exists feedback_user_idx
  on public.feedback (user_id, created_at desc);

create index if not exists feedback_type_idx
  on public.feedback (type);

comment on table public.feedback is 'User feedback stored for admin dashboard review — no email integration';

-- ------------------------------------------------------------
-- 2. UPDATED_AT TRIGGER
-- ------------------------------------------------------------

drop trigger if exists feedback_set_updated_at on public.feedback;
create trigger feedback_set_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.feedback enable row level security;

drop policy if exists "Users insert own feedback" on public.feedback;
create policy "Users insert own feedback"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users view own feedback" on public.feedback;
create policy "Users view own feedback"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins view all feedback" on public.feedback;
create policy "Admins view all feedback"
  on public.feedback for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins update all feedback" on public.feedback;
create policy "Admins update all feedback"
  on public.feedback for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ------------------------------------------------------------
-- 4. SCREENSHOT STORAGE BUCKET
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('feedback-screenshots', 'feedback-screenshots', true)
on conflict (id) do nothing;

drop policy if exists "Users upload own feedback screenshots" on storage.objects;
create policy "Users upload own feedback screenshots"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'feedback-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own feedback screenshots" on storage.objects;
create policy "Users update own feedback screenshots"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'feedback-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own feedback screenshots" on storage.objects;
create policy "Users delete own feedback screenshots"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'feedback-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view feedback screenshots" on storage.objects;
create policy "Anyone can view feedback screenshots"
  on storage.objects for select
  using (bucket_id = 'feedback-screenshots');
