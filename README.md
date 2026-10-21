# SSquare Sports Arena — Website & Staff App

Website and installable staff app for **SSquare, Nadiad**: one common turf (box cricket + football) and Nadiad's only synthetic pickleball court, open 24 hours.

- **Public website** (English / ગુજરાતી / हिन्दी): live slot availability, rates, photos, Google reviews, map, FAQ. Built for local SEO.
- **Staff app** (`/staff`, installable on Android & iPhone): bookings with WhatsApp confirmation, payments (UPI / cash, who collected the cash), expenses, analytics, Excel / PDF reports, caretaker permissions and push notifications.

Stack: Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime) · next-intl · TanStack Query · Web Push.

---

## 1. One-time setup

### Supabase
1. Create a free project at [supabase.com](https://supabase.com), region **Mumbai (ap-south-1)**.
2. **SQL Editor** → run every file in [`supabase/migrations/`](supabase/migrations) **in date order**, one after the other. They create the tables, security rules, the two courts and the starting prices. When an update adds a new migration file, run just that new file.
3. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up". Only owners create accounts, from the app.
4. **Project Settings → API Keys**: copy the project URL, a **publishable key** (`sb_publishable_…`) and a **secret key** (`sb_secret_…`). Don't use the legacy `anon` / `service_role` keys: Supabase is retiring them by the end of 2026. Once the app works with the new keys, you can disable the legacy ones on the same page.

### Environment
```bash
cp .env.example .env.local
```
Fill in `.env.local`:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys (publishable `sb_publishable_…`, secret `sb_secret_…`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | `npm run vapid:generate` |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | Google Cloud → enable **Places API (New)** → create a key restricted to that API. Find the Place ID with Google's Place ID Finder. A billing account is required; daily caching keeps usage inside the free monthly quota. |
| `NEXT_PUBLIC_SITE_URL` | Your live domain, e.g. `https://ssquarenadiad.in` |
| `CRON_SECRET` | Any long random string |
| `SEED_*_PASSWORD` | Starting passwords for shail / shubh / ravi (8+ characters) |

### Create the staff accounts
```bash
npm install
npm run seed:users
```
This creates **shail** and **shubh** (owners, full access) and **ravi** (caretaker, today's bookings only). Owners can add, remove and change caretakers later in **Settings**.

### Run locally
```bash
npm run dev
```
Website: http://localhost:3000. Staff app: http://localhost:3000/staff

---

## 2. Things you will change often (no coding needed)

| What | Where |
|---|---|
| Phone numbers, WhatsApp number, address, map, Instagram, amenities, gallery photos | [`src/config/site.ts`](src/config/site.ts) |
| Booking step, duration chips, extra items (water ₹20…), expense types, screenshot retention | [`src/config/business.ts`](src/config/business.ts) |
| Caretaker permission list and defaults | [`src/config/permissions.ts`](src/config/permissions.ts) |
| WhatsApp booking message, enquiry message, push notification text | [`src/config/messages.ts`](src/config/messages.ts) |
| All website / app wording (3 languages) | [`messages/en.json`](messages/en.json), [`gu.json`](messages/gu.json), [`hi.json`](messages/hi.json) |
| **Prices per sport (Mon–Fri / Sat–Sun), staff accounts, caretaker permissions** | In the app: **More → Settings** (no deploy needed) |

**Photos:** put real photos in `public/images/gallery/` (JPG or WebP, about 1600 px wide) and list them in `siteConfig.gallery`. Next.js serves them resized and optimized.

**Logo / app icon:** replace `scripts/assets/logo.svg`, then run `node scripts/generate-icons.mjs`.

> Before going live, search the code for `TODO`. Every placeholder (phone numbers, address, map pin) is marked. Set the real prices in the app under **More → Settings → Prices**.

---

## 3. Deploy (Vercel, free)

1. Push this repo to GitHub and import it in Vercel.
2. Add every variable from `.env.local` (except `SEED_*`) under **Project → Settings → Environment Variables**.
3. Deploy, then add your domain. `vercel.json` sets the Mumbai region and a **daily cron**, which:
   - keeps the Supabase free project from pausing, and
   - deletes UPI screenshots older than 180 days.
4. **Backups:** add the GitHub repository secret `SUPABASE_DB_URL` (Supabase → Database → Connection string → Session pooler URI). `.github/workflows/backup.yml` then saves a full database backup every Sunday, kept for 90 days.
5. **Google:** create or claim the Google Business Profile, set its website to your domain, and submit `https://<domain>/sitemap.xml` in Google Search Console.

---

## 4. Installing the staff app on phones

- **Android (Chrome):** open `https://<domain>/staff` → tap **Install app**.
- **iPhone (Safari):** open `https://<domain>/staff` → Share → **Add to Home Screen** (the app shows these steps). Open it from the home screen and log in once.
- **Notifications:** in the app, **More → Turn on notifications**. iPhone needs iOS 16.4+ and the app installed to the home screen.

Staff stay logged in until they press **Log out**.

---

## 5. How it works

```
src/
  app/[locale]/        Public website (en at "/", gu at "/gu", hi at "/hi"), statically generated
  app/staff/           Staff app (login + guarded (app) routes)
  app/api/cron/        Daily maintenance job
  config/              Editable business config (see table above)
  features/            bookings, expenses, analytics, reports, settings, notifications, public
  lib/                 time (IST), slots, pricing, payments, reports (Excel/PDF), push, supabase clients
supabase/migrations/   Schema, Row Level Security, RPCs
supabase/tests/        SQL behaviour checks (RLS + RPCs)
```

- **No double booking:** a Postgres exclusion constraint makes overlapping bookings on the same court impossible, even if two phones save at the same moment.
- **Security:** every table uses Row Level Security. Caretakers can only read what their permissions allow, and the public site only receives busy times (no names or phone numbers).
- **Money:** each payment stores its method (UPI / cash) and **who received it**, so cash per person is always known. Cancelling asks whether to keep or refund the advance.
- **Times:** everything is calculated in India Standard Time. Bookings may cross midnight.

### Checks
```bash
npm run lint && npm run typecheck && npm test
```
To apply all migrations to a throwaway local Postgres and run the SQL behaviour checks (needs `brew install postgresql`; your Supabase project is not touched):
```bash
./scripts/test-db.sh
```

---

## 6. Supabase free tier — how long will it last?

| Resource | Free limit | SSquare usage (busy estimate) |
|---|---|---|
| Database | 500 MB | ~15 MB / year, so decades |
| File storage | 1 GB | UPI screenshots compressed to ~80 KB, auto-deleted after 180 days, so it stays well below 1 GB |
| Bandwidth | 5 GB / month | Small JSON only; photos are served by Vercel |
| Monthly active users | 50,000 | A handful of staff |

Upgrade to Pro ($25/month) only if you want Supabase-managed daily backups or point-in-time restore. The free weekly GitHub backup above covers the basics.
