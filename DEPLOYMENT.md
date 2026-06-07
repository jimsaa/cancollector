# Deployment Guide — Can Collector

Deploy the **cancollector** repo to **Vercel** as a Progressive Web App (PWA) with HTTPS camera support for barcode scanning.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Vercel account](https://vercel.com) (free tier works)
- GitHub repo: **cancollector**
- Optional: [Supabase](https://supabase.com) project for cloud sync

---

## 1. Local production build

```bash
npm install
npm run build
npm run preview
```

Open `http://localhost:3003` to test the production build locally.

---

## 2. Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
vercel --prod
```

### Option B — GitHub integration

1. Push the **cancollector** repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com/new), import the **cancollector** repo.
3. Vercel auto-detects Vite — confirm these settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Root Directory | `.` (repo root) |

4. Click **Deploy**.

`vercel.json` configures SPA routing, security headers, and service worker caching.

---

## 3. Environment variables (optional)

Add in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

If omitted, the app runs in **LOCAL MODE** (data stored in the browser).

Redeploy after adding variables.

---

## 4. HTTPS and barcode scanning

Vercel serves every deployment over **HTTPS** automatically — required for mobile camera scanning.

| Environment | Camera works? |
|-------------|---------------|
| `https://cancollector.vercel.app` (your URL) | Yes |
| `http://localhost:3003` | Yes |
| `http://192.168.x.x` (LAN IP) | Limited |

---

## 5. PWA / install on mobile

### Android (Chrome)

1. Open your Vercel URL.
2. Tap **Install** banner or menu → **Install app**.

### iPhone (Safari)

1. Open your Vercel URL in Safari.
2. **Share** → **Add to Home Screen** (shows as **CanCollector**).

---

## 6. Post-deploy checklist

- [ ] App loads at your Vercel URL
- [ ] Dashboard shows (LOCAL MODE badge if no Supabase)
- [ ] Barcode scanner works over HTTPS on mobile
- [ ] Install / Add to Home Screen works
- [ ] Routes work: `/collection`, `/add`, `/trade`

---

## 7. Troubleshooting

### Blank page after deploy

- Check Vercel build logs.
- Confirm repo root contains `package.json` and `vercel.json`.

### Camera not working

- Use the `https://` Vercel URL, not plain HTTP.

### Supabase not connecting

- Env vars must start with `VITE_`.
- Redeploy after changing variables.
