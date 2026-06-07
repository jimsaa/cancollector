# Supabase Auth — Configuration Checklist

Complete these steps before testing registration and cloud sync in Can Collector.

---

## 1. Create Supabase project

- [ ] Create project at [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] Save database password securely
- [ ] Wait for project status **Active**

---

## 2. Enable Email authentication

- [ ] Open **Authentication → Providers**
- [ ] Confirm **Email** provider is **Enabled**
- [ ] **Development:** Authentication → **Sign In / Providers → Email** → disable **Confirm email** (instant sign-up/login)
- [ ] **Production:** Keep **Confirm email** enabled and configure SMTP (optional)

---

## 3. Site URL & redirect URLs

- [ ] **Authentication → URL Configuration**
- [ ] Set **Site URL** to your app origin (e.g. `http://localhost:3003` or production URL)
- [ ] Add **Redirect URLs**:
  - `http://localhost:3003/**`
  - Your Vercel/production URL

---

## 4. Run SQL migrations (in order)

In **SQL Editor → New query**, run each file:

| Order | File | Purpose |
|-------|------|---------|
| 1 | [`migration.sql`](./migration.sql) | Core tables, cans RLS, storage, profile trigger |
| 2 | [`migration-auth-complete.sql`](./migration-auth-complete.sql) | Profiles `role`, RLS, backfill users |
| 3 | [`migration-v2.sql`](./migration-v2.sql) | Wishlist columns (if upgrading) |
| 4 | [`migration-master-cans.sql`](./migration-master-cans.sql) | Global can database |
| 5 | [`migration-master-can-v1.sql`](./migration-master-can-v1.sql) | Master DB v1 fields |
| 6 | [`migration-master-can-approval.sql`](./migration-master-can-approval.sql) | Pending suggestions + admin RLS |
| 7 | [`migration-can-image-source.sql`](./migration-can-image-source.sql) | Image source columns |
| 8 | [`migration-trade-matching.sql`](./migration-trade-matching.sql) | Trade tables |
| 9 | [`migration-trade-listings-detail.sql`](./migration-trade-listings-detail.sql) | Trade listing details |

- [ ] All migrations ran without errors

---

## 5. Environment variables

- [ ] Copy `.env.example` → `.env` in project root
- [ ] Set `VITE_SUPABASE_URL` from **Project Settings → API → Project URL**
- [ ] Set `VITE_SUPABASE_ANON_KEY` from **Project Settings → API → anon public** key
- [ ] **Never** commit `.env` or use the **service_role** key in the frontend

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

- [ ] Restart dev server after changing `.env`: `npm run dev`

---

## 6. Verify database objects

In **Table Editor**, confirm:

- [ ] `profiles` table exists with columns: `id`, `email`, `display_name`, `role`, `premium_status`
- [ ] `cans` table exists with `user_id` FK to `auth.users`
- [ ] RLS **enabled** on `profiles` and `cans` (shield icon)

In **Database → Triggers**:

- [ ] `on_auth_user_created` trigger on `auth.users`

---

## 7. Create an admin user (optional)

After registering your first account:

```sql
update public.profiles
set role = 'admin'
where email = 'your@email.com';
```

- [ ] Admin can access `/admin/master-cans` when logged in

---

## 8. Test registration flow

- [ ] App shows **GUEST MODE** without login
- [ ] **Create Free Account** opens `/register` (not info-only modal)
- [ ] Register with display name, email, password
- [ ] User lands on dashboard with **CLOUD SYNCED** badge
- [ ] `profiles` row created in Supabase
- [ ] If guest cans existed → **Import your local collection?** screen appears
- [ ] **Import Now** copies cans to cloud `cans` table
- [ ] **Sign out** returns to guest mode
- [ ] **Sign in** restores cloud collection

---

## 9. Troubleshooting

| Issue | Fix |
|-------|-----|
| Register button does nothing / modal only | Ensure `.env` has Supabase keys; restart dev server |
| "Invalid login credentials" after sign-up | Disable **Confirm email** in dev, or verify email first |
| Profile not created | Re-run `migration-auth-complete.sql`; check trigger |
| Cans not saving to cloud | User must be logged in; check `cans` RLS policies |
| Import not prompted | Add cans as guest first, then register on same browser |
| RLS policy violation | Confirm `user_id` matches `auth.uid()` on insert |

---

## 10. Security reminders

- [ ] Use **anon** key only in the Vite app
- [ ] Keep **service_role** key server-side only (never in frontend)
- [ ] RLS enabled on all user data tables
- [ ] Admin actions gated by `profiles.role = 'admin'`
