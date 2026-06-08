# CanTrove

Collect • Track • Trade

A mobile-first PWA for collecting energy drink cans. Scan barcodes, auto-fetch product data from Open Food Facts, upload images, and manage your personal collection.

## Tech Stack

- React + TypeScript
- Vite + PWA
- Tailwind CSS
- Supabase (optional — Local Mode works without it)
- @zxing/browser (barcode scanning)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase (optional)

See **[supabase/SETUP.md](./supabase/SETUP.md)** for the full guide.

Without Supabase credentials, the app runs in **LOCAL MODE** (data stored in the browser). With Supabase configured, it runs in **CLOUD MODE** with user accounts and online sync.

Quick version:

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migration.sql` (or `migration-auth.sql` on existing projects)
3. Copy `.env.example` to `.env` and add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon key only — never service role)
4. Enable Email auth in Authentication → Providers

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003).

## Features

- **Auth** — register, login, logout, profile (Cloud Mode)
- **Local → cloud import** — migrate localStorage collection after sign-in
- **Dashboard** — collection stats and recently added cans
- **Add Can** — camera barcode scanner + manual entry, Open Food Facts lookup
- **Collection** — searchable grid with filters, sorting, export/import backup
- **Wishlist** — track wanted and missing cans
- **Can Detail** — view/edit metadata, toggle opened/trade status, delete
- **Trade List** — shareable list of cans available for trade
- **Premium** — placeholder page (coming soon)
- **PWA** — installable on mobile, works over HTTPS on Vercel

## Barcode Scanning

Requires HTTPS or localhost and camera permission. Deploy to Vercel for reliable mobile scanning.

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel + PWA)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full Vercel deployment instructions.

Quick deploy:

```bash
npm install -g vercel
vercel --prod
```
