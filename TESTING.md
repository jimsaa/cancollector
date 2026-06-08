# CanTrove — MVP Manual Test Checklist

Use this document to verify core guest, cloud, trade, wishlist, and admin flows before release.

**App:** CanTrove (`monster-collector`)  
**Dev URL:** [http://localhost:3003](http://localhost:3003)  
**Last updated:** MVP v1 (master database, add-can wizard, admin approval)

---

## Before you start

### Environment options

| Mode | Setup | Header badge |
|------|--------|--------------|
| **Guest / Local** | No `.env` or empty Supabase keys | `GUEST MODE` |
| **Cloud** | `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, migrations applied | `CLOUD SYNCED` when logged in |

### Commands

```bash
cd monster-collector
npm install
npm run dev      # http://localhost:3003
npm run build    # production build check
```

### Test data tips

- Use a **barcode not in the master seed** (e.g. `5053947891234`) to trigger a **pending suggestion**.
- Use a **seed barcode** (e.g. `9900100000001`) to match the master database immediately.
- **Local admin PIN:** `3513` (Local Mode only, `/admin/master-cans`).
- **Cloud admin:** set `profiles.role = 'admin'` in Supabase for your user.

### Checklist legend

- [ ] Step not run
- [x] Pass
- [ ] Fail — note issue in **Notes** column

---

## Quick smoke (5 min)

| # | Flow | Pass |
|---|------|------|
| 1 | Guest adds can manually | [ ] |
| 6 | Guest marks can for trade | [ ] |
| 9 | Guest sees missing cans | [ ] |
| 12 | Logged-in user saves to cloud | [ ] |

---

## Full MVP test flows

### 1. Guest adds can manually

**Goal:** A guest can add a can without scanning, using the 4-step wizard. Nothing is saved until the final step.

| Step | Action | Expected result |
|------|--------|-----------------|
| 1.1 | Open app without logging in. Confirm **GUEST MODE** (or guest banner). | Guest state visible. |
| 1.2 | Tap **Add** in bottom nav → `/add`. | Add Can wizard opens; progress shows **Scan → Match → Review → Save**. |
| 1.3 | On **Scan**, enter barcode manually (e.g. `5053947891234`) and tap search. | Lookup runs (Open Food Facts + master DB). Wizard advances to **Match**. |
| 1.4 | On **Match**, review product data and image source. Tap **Continue**. | **Review** step opens with editable fields. |
| 1.5 | Enter **Name** (required), brand, flavor, volume, country. Tap **Continue to Summary**. | **Save** summary shows all fields and image. |
| 1.6 | Tap **Save Can**. | Redirects to can detail page. Can appears on **Collection** and **Dashboard**. |
| 1.7 | Refresh the browser. | Can still present (localStorage). |

**Pass criteria:** Can saved only on final Save; visible in collection after refresh.

**Notes:** _______________________________________________

---

### 2. Guest scans barcode

**Goal:** Camera barcode scan fills the wizard and advances to Match.

| Step | Action | Expected result |
|------|--------|-----------------|
| 2.1 | On `/add`, tap **Start Scan** (HTTPS or localhost required). | Camera preview activates. |
| 2.2 | Scan a real can barcode (or use a test barcode image on screen). | Scan stops; barcode fills manual field; lookup starts. |
| 2.3 | Wait for **Match** step. | Product name / OFF or master data shown; progress on step 2. |
| 2.4 | Complete wizard through **Save**. | Can saved with scanned barcode. |

**Pass criteria:** Scanned barcode matches saved can; wizard flow unchanged from manual entry.

**Fallback:** If camera unavailable, yellow **Camera unavailable** card appears; manual entry still works.

**Notes:** _______________________________________________

---

### 3. Guest uploads own image

**Goal:** User photo overrides automatic product image (priority 1).

| Step | Action | Expected result |
|------|--------|-----------------|
| 3.1 | In add wizard **Review** step, tap **Upload image** and choose a photo. | Preview updates; badge shows **Your photo**. |
| 3.2 | Tap **Use My Photo** (if not already active). | Image source = user. |
| 3.3 | Save can and open **Can detail**. | Image is user upload; source label shows **Your photo**. |
| 3.4 | Open **Collection** grid. | Same image on card. |

**Pass criteria:** `image_source` is user; user image visible on detail and collection.

**Notes:** _______________________________________________

---

### 4. Guest edits can

**Goal:** All core metadata can be updated from the detail page.

| Step | Action | Expected result |
|------|--------|-----------------|
| 4.1 | Open a can from **Collection** → `/can/:id`. | Edit form loads with current values. |
| 4.2 | Change name, brand, flavor, volume, country, quantity, opened, notes. | Fields update in UI. |
| 4.3 | Tap **Save changes**. | Success message; values persist after reload. |
| 4.4 | Toggle **Opened** and save again. | Opened badge on collection card updates. |

**Pass criteria:** Edits persist in localStorage after refresh.

**Notes:** _______________________________________________

---

### 5. Guest deletes can

**Goal:** Can is removed from collection without breaking the app.

| Step | Action | Expected result |
|------|--------|-----------------|
| 5.1 | Open can detail for a test can. | Detail page loads. |
| 5.2 | Tap **Delete** and confirm. | Redirect to Collection or Wishlist. |
| 5.3 | Search collection for deleted can. | Not found. |
| 5.4 | Refresh browser. | Still deleted. |

**Pass criteria:** Can removed from collection and localStorage.

**Notes:** _______________________________________________

---

### 6. Guest marks can for trade

**Goal:** Can flagged for trade from detail or trade page.

| Step | Action | Expected result |
|------|--------|-----------------|
| 6.1 | Open can detail (collection can, not wishlist). | Trade checkbox visible. |
| 6.2 | Check **Available for trade** → **Save changes**. | Saves successfully. |
| 6.3 | Open **Trade** → Offering tab. | Can listed under quick-mark or collection for trade. |
| 6.4 | Open **Collection**. | **Trade** badge on card. |

**Alternate:** Trade page → quick-mark row → toggle checkbox for a can.

**Pass criteria:** `available_for_trade` true; visible on Trade and collection card.

**Notes:** _______________________________________________

---

### 7. Guest creates trade listing

**Goal:** Active trade listing with details after can is marked for trade.

| Step | Action | Expected result |
|------|--------|-----------------|
| 7.1 | Mark can for trade and save (flow 6). | Trade listing editor appears on detail (or prompt to save first). |
| 7.2 | Fill **condition**, **description**, **asking for**; add extra image URL if desired; optional YouTube URL. | Fields accept input. |
| 7.3 | Save listing. | Listing saved locally. |
| 7.4 | Open **Trade** → Offering. | **Active listing** appears (not hidden/rejected). |
| 7.5 | Tap listing card → `/trade/listing/:id`. | Detail page shows listing fields and images. |

**Pass criteria:** Only **active** listings (`available` / `reserved`) show on Trade Offering tab.

**Notes:** _______________________________________________

---

### 8. Guest adds wishlist item

**Goal:** Wishlist supports manual items and master-db **Want** toggles.

| Step | Action | Expected result |
|------|--------|-----------------|
| 8.1 | Open **Wishlist** → `/wishlist`. | Wishlist page loads. |
| 8.2 | **Manual:** Add custom wishlist item (name, brand, etc.) and save. | Item appears in wishlist. |
| 8.3 | Tap item → can detail. | Wishlist fields (wanted / missing) available. |
| 8.4 | **From master DB:** Open **Missing** → tap **Want** on a missing can. | Item added to wishlist; button shows **Wanted**. |
| 8.5 | Open **Wishlist** again. | Master-linked item visible (Global DB badge if linked). |

**Pass criteria:** Wishlist count increases; wanted state persists after refresh.

**Notes:** _______________________________________________

---

### 9. Guest sees missing cans

**Goal:** Missing page lists master cans not owned, with filters and progress.

| Step | Action | Expected result |
|------|--------|-----------------|
| 9.1 | Open **Missing** → `/missing` (or Dashboard progress card). | Missing cans list loads. |
| 9.2 | Confirm **Collection progress**: Owned / Master Database / %. | Numbers match owned vs seed master count. |
| 9.3 | Filter by **brand**, **rarity**, **country**, **discontinued**. | List updates correctly. |
| 9.4 | Search by name or barcode. | Matching missing cans only. |
| 9.5 | Own a master can (add with seed barcode `9900100000001`). Return to Missing. | That can no longer in missing list. |

**Pass criteria:** Missing = active master cans not in user collection; filters work.

**Notes:** _______________________________________________

---

### 10. Guest registers account

**Goal:** Guest can create a cloud account without losing context.

| Step | Action | Expected result |
|------|--------|-----------------|
| 10.1 | As guest with ≥1 can saved, open **Profile** or register CTA. | Register option available. |
| 10.2 | Go to `/register`. Enter display name, email, password. | Account created (or confirm email per Supabase settings). |
| 10.3 | Log in at `/login`. | Header shows **CLOUD SYNCED**; profile loads. |

**Prerequisites:** Supabase configured; Email auth enabled.

**Pass criteria:** User authenticated; `isCloudSynced` true.

**Notes:** _______________________________________________

---

### 11. Local cans import after registration

**Goal:** Guest collection migrates to cloud after first login.

| Step | Action | Expected result |
|------|--------|-----------------|
| 11.1 | As guest, add 2–3 cans with distinct names. | Cans in localStorage. |
| 11.2 | Register and log in. | Redirect to `/import-local` if local cans exist. |
| 11.3 | Tap **Import to cloud** (or equivalent). | Success summary: imported count shown. |
| 11.4 | Open **Collection**. | Same cans visible under cloud account. |
| 11.5 | Optional: clear local collection when prompted. | Cloud remains source of truth. |

**Pass criteria:** All guest cans appear in cloud collection; import status stored.

**Notes:** _______________________________________________

---

### 12. Logged-in user saves cans to cloud

**Goal:** New cans persist in Supabase `cans` table.

| Step | Action | Expected result |
|------|--------|-----------------|
| 12.1 | Log in (cloud mode). Add a new can via wizard. | Save succeeds. |
| 12.2 | Open Supabase Dashboard → Table Editor → `cans`. | Row with `user_id` and can data. |
| 12.3 | Log out and log in again (or new browser). | Can still in collection. |
| 12.4 | Edit can and save. | Supabase row updated. |

**Pass criteria:** CRUD reflected in Supabase; survives session restart.

**Notes:** _______________________________________________

---

### 13. Admin approves pending can suggestion

**Goal:** Unknown barcode creates pending suggestion; admin approves into master DB.

| Step | Action | Expected result |
|------|--------|-----------------|
| 13.1 | As guest, add can with **unknown barcode** (not in seed). Complete wizard **Save**. | User can saved; pending suggestion created (local storage in guest mode). |
| 13.2 | Open `/admin/master-cans`. | Admin UI loads. |
| 13.3 | **Local:** Enter PIN `3513`. **Cloud:** Log in as `role = admin`. | Pending suggestions list visible. |
| 13.4 | Tap **Edit** / **Approve** on suggestion. Set product name, brand, flavor, volume, country, rarity, image URL. | Edit form opens. |
| 13.5 | Tap **Approve**. | Success message; linked can count ≥ 0; suggestion removed from pending. |
| 13.6 | Add another can with **same barcode**. | **Match** step shows master DB hit; no new pending suggestion. |

**Reject path:** Tap **Reject** → suggestion leaves pending; user can remains in private collection only.

**Pass criteria:** Approved barcode in master DB; user cans linked by barcode; reject does not delete user cans.

**Notes:** _______________________________________________

---

### 14. Master database updates completion percentage

**Goal:** Owning a master can increases Owned and completion %.

| Step | Action | Expected result |
|------|--------|-----------------|
| 14.1 | Note **Owned / Master Database / %** on Dashboard or Missing. | Baseline recorded (e.g. `2 / 25 · 8%`). |
| 14.2 | Add can with master seed barcode (e.g. `9900100000002`) not yet owned. | Save succeeds; `master_can_id` linked if barcode matches. |
| 14.3 | Return to Dashboard / Missing progress card. | **Owned** increased by 1; **%** increased; **missing** decreased by 1. |
| 14.4 | **Admin path:** Approve pending can (flow 13), then add user can with that barcode. | Progress updates after ownership. |

**Pass criteria:** `computeCollectionProgress` reflects new ownership immediately after add/link.

**Notes:** _______________________________________________

---

## Regression checks (do not break)

| Area | Quick check | Pass |
|------|-------------|------|
| Scanner | `/add` → Start Scan / Stop Scan | [ ] |
| Add wizard | Back navigation between steps | [ ] |
| Trade listings | Trade page loads; matches tab | [ ] |
| Collection | Search, filters, sort | [ ] |
| Backup | `/backup` export (premium gates if applicable) | [ ] |
| Build | `npm run build` exits 0 | [ ] |

---

## Test session log

| Date | Tester | Build / commit | Environment | Pass | Fail | Blocked |
|------|--------|----------------|-------------|------|------|---------|
| | | | Guest / Cloud | | | |
| | | | Guest / Cloud | | | |

---

## Known limitations (MVP)

- Barcode scan requires HTTPS or localhost and camera permission.
- Open Food Facts may return no image for some products; placeholder used.
- Cloud admin requires `profiles.role = 'admin'` in Supabase (not PIN).
- Local admin PIN (`3513`) is for Local Mode testing only.
- Premium backup features may be gated for free users.

---

## Reporting issues

When logging a failure, include:

1. Flow number and step
2. Guest vs cloud, browser, device
3. Screenshot or console error
4. Whether data survived refresh

File issues in the project tracker or GitHub repo: [jimsaa/cancollector](https://github.com/jimsaa/cancollector).
