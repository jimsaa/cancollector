# Supabase Setup — Can Collector

This guide walks through everything needed to connect the app to Supabase: database, storage, auth, environment variables, and running locally.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A free [Supabase](https://supabase.com) account

---

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Choose an organization, name (e.g. `cancollector`), database password, and region.
4. Wait for the project to finish provisioning.

---

## 2. Enable authentication

The app uses email + password sign-in with user profiles.

1. In the Supabase dashboard, open **Authentication → Providers**.
2. Ensure **Email** is enabled (it is by default).
3. Optional: under **Authentication → Settings**, turn off **Confirm email** during development so you can sign up and sign in immediately without verifying email.

### App modes

| Mode | When | Behavior |
|------|------|----------|
| **LOCAL MODE** | `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` missing | Data in `localStorage`; no login required |
| **CLOUD MODE** | Both env vars set | Supabase Auth + cloud collection; login required |

When you add Supabase credentials to an app that was used in Local Mode, sign in and you will be prompted to **import your local collection** into the cloud.

---

## 3. Run the SQL schema

Open **SQL Editor** in the Supabase dashboard, click **New query**, paste the script below, and click **Run**.

Paste and run **[`migration.sql`](./migration.sql)** — the complete, idempotent migration for new projects. It creates:

- `profiles` and `cans` tables (with `updated_at` columns and triggers)
- Indexes for common queries
- RLS on both tables
- Auto-create profile trigger on `auth.users` insert
- `can-images` storage bucket + policies

**Existing projects:** If you already ran an older schema, run [`migration-auth.sql`](./migration-auth.sql) to add profiles and backfill users, or re-run `migration.sql` (safe to re-run).

```sql
-- ============================================================
-- Can Collector — full Supabase setup
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT where possible
-- ============================================================

-- ------------------------------------------------------------
-- 1. CANS TABLE
-- ------------------------------------------------------------
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
  rarity text default 'unknown' not null
    check (rarity in ('common', 'uncommon', 'rare', 'unknown')),
  quantity integer default 1 not null check (quantity >= 1)
);

comment on table public.cans is 'User Monster Energy can collections';

-- Indexes for common queries
create index if not exists cans_user_id_idx
  on public.cans (user_id);

create index if not exists cans_added_date_idx
  on public.cans (added_date desc);

create index if not exists cans_available_for_trade_idx
  on public.cans (available_for_trade)
  where available_for_trade = true;

-- ------------------------------------------------------------
-- 2. ROW LEVEL SECURITY — cans table
-- Each user can only access their own rows
-- ------------------------------------------------------------
alter table public.cans enable row level security;

drop policy if exists "Users can view own cans" on public.cans;
create policy "Users can view own cans"
  on public.cans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cans" on public.cans;
create policy "Users can insert own cans"
  on public.cans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cans" on public.cans;
create policy "Users can update own cans"
  on public.cans for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own cans" on public.cans;
create policy "Users can delete own cans"
  on public.cans for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. STORAGE BUCKET — can images
-- Public bucket so image URLs work in <img> tags without signed URLs
-- Files are stored as: {user_id}/{uuid}.{ext}
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('can-images', 'can-images', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — storage.objects
-- Authenticated users upload only into their own folder (user_id/)
-- Anyone can read images (public bucket)
-- ------------------------------------------------------------
drop policy if exists "Users can upload can images" on storage.objects;
create policy "Users can upload can images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view can images" on storage.objects;
create policy "Anyone can view can images"
  on storage.objects for select
  using (bucket_id = 'can-images');

drop policy if exists "Users can update own can images" on storage.objects;
create policy "Users can update own can images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own can images" on storage.objects;
create policy "Users can delete own can images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'can-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

> **Note:** The same script lives in [`schema.sql`](./schema.sql) in this folder. Use either file — they are equivalent.

### Verify the setup

In the Supabase dashboard:

| Check | Where |
|-------|-------|
| `profiles` table exists (`display_name`, `premium_status`, `premium_until`) | **Table Editor** |
| `cans` table exists with all columns | **Table Editor** |
| RLS is enabled on `profiles` and `cans` | **Table Editor → RLS** |
| `on_auth_user_created` trigger exists | **Database → Triggers** (or re-run migration) |
| `can-images` bucket exists and is **Public** | **Storage** |

---

## 4. Storage bucket details

| Setting | Value |
|---------|-------|
| Bucket name | `can-images` |
| Public | Yes (required for public image URLs in the app) |
| Upload path pattern | `{user_id}/{random-uuid}.{ext}` |

The app uploads files in `src/lib/storage.ts` using the authenticated user's ID as the top-level folder. Storage RLS ensures users can only write, update, or delete files inside their own folder.

**Manual alternative (dashboard only):**

If you prefer not to use SQL for storage:

1. Go to **Storage → New bucket**.
2. Name: `can-images`
3. Enable **Public bucket**.
4. Still run the storage RLS policies from the SQL above (policies cannot be fully configured from the UI alone).

---

## 5. Row Level Security summary

### `public.profiles`

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can view own profile | `SELECT` | `auth.uid() = id` |
| Users can insert own profile | `INSERT` | `auth.uid() = id` |
| Users can update own profile | `UPDATE` | `auth.uid() = id` |

### `public.cans`

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can view own cans | `SELECT` | `auth.uid() = user_id` |
| Users can insert own cans | `INSERT` | `auth.uid() = user_id` |
| Users can update own cans | `UPDATE` | `auth.uid() = user_id` |
| Users can delete own cans | `DELETE` | `auth.uid() = user_id` |

When a user is signed in, Supabase automatically sets `auth.uid()` to their user UUID. No user can read or modify another user's cans.

### `storage.objects` (bucket: `can-images`)

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can upload can images | `INSERT` | Authenticated; first path segment = `auth.uid()` |
| Anyone can view can images | `SELECT` | Bucket is `can-images` |
| Users can update own can images | `UPDATE` | Authenticated; first path segment = `auth.uid()` |
| Users can delete own can images | `DELETE` | Authenticated; first path segment = `auth.uid()` |

---

## 6. Environment variables

### Get your Supabase credentials

1. In the Supabase dashboard, open **Project Settings → API**.
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

> Use the **anon** key, not the `service_role` key. The anon key is safe to expose in the browser; RLS protects your data.

### Create `.env`

From the project root:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key for client-side auth and API calls |

Restart the dev server after changing `.env`.

---

## 7. Install commands

From the repository root:

```bash
npm install
```

This installs React, Vite, Tailwind, Supabase JS client, barcode scanner, and other dependencies listed in `package.json`.

---

## 8. Run the app locally

```bash
npm run dev
```

Vite prints a local URL, usually:

```
http://localhost:3003
```

Open that URL in your browser.

### First-time app flow (Cloud Mode)

1. With `.env` configured, restart `npm run dev` — the header shows **CLOUD MODE**.
2. Open **Register** (`/register`) and create an account with name, email, and password.
3. After sign-in, if you used Local Mode before, you will see **Import local collection?**
4. Use **Add** to scan or enter a barcode and save a can.
5. Open **Profile** to see your name, email, plan status, and sign out.

### Local Mode (no Supabase)

1. Leave `.env` empty or omit Supabase variables.
2. The header shows **LOCAL MODE** — no login required.
3. Add Supabase credentials later to switch to Cloud Mode and import your local cans.

### Other useful commands

```bash
npm run build    # Production build → dist/
npm run preview  # Serve the production build locally
npm run lint     # Run ESLint
```

---

## Troubleshooting

### "Supabase Not Configured" on launch

- `.env` is missing or variables are empty.
- Dev server was not restarted after creating `.env`.
- Variable names must be exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Vite only exposes `VITE_*` vars).

### Sign-up works but adding cans fails

- Confirm the SQL schema ran without errors.
- Check **Table Editor** for the `cans` table and that RLS policies exist.
- In the browser dev tools **Network** tab, inspect the failed Supabase request for the error message.

### Image upload fails

- Confirm the `can-images` bucket exists and is public.
- Confirm storage RLS policies were created.
- Uploads require a signed-in user (auth token must be present).

### Camera / barcode scanner not working

- Use `localhost` or HTTPS (required by browsers for camera access).
- Grant camera permission when prompted.
- On desktop, a webcam works; on mobile, use the rear camera.

---

## Security notes

- **Never** put the `service_role` key in `.env` or frontend code.
- RLS is the primary isolation layer — each user only sees their own `cans` rows.
- Storage uploads are scoped per user via folder name + RLS.
- For production, consider enabling email confirmation and setting up custom SMTP under **Authentication → Settings**.
