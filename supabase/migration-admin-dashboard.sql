-- CanTrove — Admin dashboard stats (RLS for trade listing counts)
-- Safe to re-run. Run after migration-trade-matching.sql and migration-premium-admin.sql
--
-- The admin dashboard reads aggregate counts client-side. Most tables already allow
-- admin reads via existing policies (profiles, cans, feedback, pending_can_suggestions).
-- Trade listings need an explicit admin read policy for accurate stats.

drop policy if exists "Admins can view all trade listings" on public.trade_listings;
create policy "Admins can view all trade listings"
  on public.trade_listings for select
  to authenticated
  using (public.is_admin_user());

comment on policy "Admins can view all trade listings" on public.trade_listings is
  'Allows admin dashboard to count active listings and top traders without exposing data to regular users';
