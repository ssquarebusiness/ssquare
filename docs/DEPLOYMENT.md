# Deploying SSquare to Vercel

A step-by-step guide from code on your laptop to a live website and installable staff app.
Allow about 45 minutes the first time.

| What | Where |
|---|---|
| Code | GitHub — `ssquarebusiness/ssquare` |
| Website + staff app | Vercel (free Hobby plan) |
| Database, logins, screenshots | Supabase (free plan) |
| Backups + checks | GitHub Actions (free) |

---

## Step 0 — Push the code to GitHub

The remote is already added on this Mac (`origin → https://github.com/ssquarebusiness/ssquare.git`).
The first push was **refused (403)** because this Mac is logged in to GitHub as `AyushGandhi2004`,
which has no write access to the `ssquarebusiness` repo. Fix it with **one** of these:

**Option A (recommended): give your account access**
1. Sign in to GitHub as **ssquarebusiness**.
2. Open the repo → **Settings → Collaborators → Add people** → add `AyushGandhi2004` with **Write** access.
3. Accept the invitation (email, or github.com/ssquarebusiness/ssquare/invitations) while logged in as AyushGandhi2004.
4. Push:
   ```bash
   git push -u origin main
   ```

**Option B: push as the ssquarebusiness account**
```bash
gh auth login        # choose GitHub.com → HTTPS → sign in as ssquarebusiness
gh auth setup-git
git push -u origin main
```
Later, `gh auth switch` switches between the two accounts.

> Secrets are never pushed: `.env.local` is ignored by git, and only `.env.example` (no values) is in the repo.

---

## Step 1 — Supabase (database)

Skip any part you already did.

1. **Project:** [supabase.com](https://supabase.com) → New project → Region **South Asia (Mumbai)**. Save the database password.
2. **Database setup:** **SQL Editor** → run each file from `supabase/migrations/` **in this order**, one at a time:
   1. `20261014000001_init.sql`
   2. `20261021000001_sport_rates_optional_customer.sql`
   3. `20261022000001_today_includes_late_night.sql`
   4. `20261023000001_owner_edit_booking.sql`
3. **Turn off public sign-ups:** **Authentication → Sign In / Providers → Email** → disable **Allow new users to sign up**. Only owners create accounts, from the app.
4. **API keys:** **Project Settings → API Keys** → copy:
   - **Project URL**
   - **Publishable key** (`sb_publishable_…`)
   - **Secret key** (`sb_secret_…`). Keep it private.
5. **Staff accounts:** put the values in `.env.local` on your laptop and run:
   ```bash
   npm run seed:users
   ```
   This creates `shail` and `shubh` (owners) and `ravi` (caretaker).
6. **Prices:** after deploying, set the real prices in the app under **More → Settings → Prices**.

---

## Step 2 — Generate the secrets

Run these on your laptop and keep the output for Step 4.

```bash
npm run vapid:generate
```
This prints a **Public Key** and a **Private Key** for phone notifications.

```bash
openssl rand -hex 32
```
This prints a random string for **CRON_SECRET**.

**Google reviews (optional, can be added later):**
1. [console.cloud.google.com](https://console.cloud.google.com) → create a project → **Billing** → link a billing account (a card is required; daily caching keeps usage inside the free monthly quota).
2. **APIs & Services → Library** → enable **Places API (New)**.
3. **Credentials → Create credentials → API key** → **Restrict key** → API restrictions: **Places API (New)** only.
4. Find your **Place ID** with Google's *Place ID Finder* (search "SSquare Nadiad").

Without these two values the website shows "Played at SSquare? We would love to hear from you" instead of live reviews.

---

## Step 3 — Import the project into Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up / Log in with GitHub**, using the **ssquarebusiness** GitHub account so the project belongs to the business.
2. **Add New… → Project** → find `ssquare` → **Import**.
   If it isn't listed: **Adjust GitHub App Permissions** → give Vercel access to the `ssquare` repo.
3. Leave the build settings as detected:
   - Framework preset: **Next.js**
   - Root directory: `./`
   - Build command: `next build`; install command: `npm install`
4. **Before clicking Deploy**, open **Environment Variables** and add everything from Step 4.

> Vercel's free **Hobby** plan is meant for non-commercial use. It works technically; for a business, Vercel's terms expect the **Pro** plan ($20/month). You can upgrade later without changing anything in the code.

---

## Step 4 — Environment variables in Vercel

Add each one with all three environments ticked (**Production, Preview, Development**).

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Safe for the browser |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | **Mark as Sensitive.** Server only |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID Public Key | From Step 2 |
| `VAPID_PRIVATE_KEY` | VAPID Private Key | **Sensitive** |
| `VAPID_SUBJECT` | `mailto:ssquarebusiness2503@gmail.com` | Any contact email |
| `CRON_SECRET` | the random string | **Sensitive.** Vercel sends it to the daily job automatically |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` for now | Change to your own domain in Step 6 |
| `GOOGLE_PLACES_API_KEY` | Google key | Optional |
| `GOOGLE_PLACE_ID` | Place ID | Optional |

Do **not** add the `SEED_*_PASSWORD` values. They're only used on your laptop.

Then click **Deploy**. The first build takes 2–4 minutes.

> Variables starting with `NEXT_PUBLIC_` are baked in at build time. After changing one, go to **Deployments → ⋯ → Redeploy**.

---

## Step 5 — First checks (about 5 minutes)

Open `https://<your-project>.vercel.app`:

- [ ] Homepage loads; the **Free slots** card shows today's hours (not an error).
- [ ] **Courts & rates** shows your prices; the ગુજરાતી and हिन्दी links switch language.
- [ ] `/staff` → log in as **shail** → Home loads.
- [ ] Create a test booking → popup with Copy / WhatsApp → it appears in Today's bookings and as booked on the website.
- [ ] Cancel the test booking.
- [ ] **More → Turn on notifications** on an owner's phone → **Send test** arrives.
- [ ] **More → Reports** → download Excel and PDF.

---

## Step 6 — Your own domain (recommended)

1. Buy a domain (for example from GoDaddy, Hostinger or Namecheap), such as `ssquarenadiad.in`.
2. Vercel → Project → **Settings → Domains** → add `ssquarenadiad.in` and `www.ssquarenadiad.in`.
3. At your domain provider, add the DNS records Vercel shows. Usually:
   - `A` record: `@` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com`
4. Wait until Vercel shows **Valid Configuration** (minutes to a few hours). HTTPS is automatic.
5. Update `NEXT_PUBLIC_SITE_URL` to `https://ssquarenadiad.in` → **Redeploy**. This fixes the links in Google results, the sitemap and WhatsApp previews.
6. Supabase → **Authentication → URL Configuration** → set **Site URL** to the same address.

---

## Step 7 — Daily job, backups and checks

**Daily job (automatic)**
- `vercel.json` schedules `/api/cron/daily` once a day (about 3 AM IST). It:
  - keeps the free Supabase project from pausing;
  - deletes UPI screenshots older than `screenshotRetentionDays` (in `src/config/business.ts`).
- Check it under Vercel → Project → **Settings → Cron Jobs**. To run it once by hand:
  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-domain>/api/cron/daily
  ```
  It should return `{"ok":true,...}`.

**Weekly database backup (one-time setup)**
1. Supabase → **Connect** (top bar) → **Session pooler** → copy the URI and put your database password into it.
2. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `SUPABASE_DB_URL`
   - Value: that URI
3. GitHub → **Actions → Weekly database backup → Run workflow** to test it.
4. Backups appear as downloadable files on each run and are kept for 90 days.

**CI:** every push runs lint, type checks and tests automatically (**Actions → CI**).

---

## Step 8 — Install the staff app on phones

- **Android (Chrome):** open `https://<domain>/staff` → **Install app** → log in once.
- **iPhone (Safari only):** open `https://<domain>/staff` → Share → **Add to Home Screen** → open it from the home screen → log in once.
- **Notifications:** inside the installed app, **More → Turn on notifications**. iPhone needs iOS 16.4 or newer.

---

## Step 9 — Get found on Google

1. **Google Business Profile:** create or claim **SSquare Sports Arena, Nadiad**. Set:
   - Category: *Sports complex* or *Cricket ground*
   - Hours: **Open 24 hours**
   - Website: your domain
   - Photos of the turf and the court
2. **Google Search Console:** add your domain → verify through DNS → **Sitemaps** → submit `https://<domain>/sitemap.xml`.
3. Ask happy players for Google reviews. The website shows them automatically, refreshed daily.

---

## Everyday updates

- **Code changes:** push to `main` and Vercel deploys automatically in about 2 minutes. Pushes to other branches get a separate **preview** link for testing.
- **Database changes:** when a commit adds a new file to `supabase/migrations/`, run that file in the Supabase SQL Editor **before** (or right when) the code deploys.
- **Prices, staff accounts, permissions:** change them in the app. No deploy needed.
- **Contact details, photos, wording:** edit `src/config/site.ts` or `messages/*.json`, then push.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails on Vercel | Open the deployment → **Build Logs**. Usually a missing environment variable; add it and redeploy. |
| Website says it can't load slots | Check `NEXT_PUBLIC_SUPABASE_URL` and the publishable key, then redeploy. |
| Staff login says wrong username or password | Check the user exists (Supabase → Authentication → Users); reset the password from another owner's Settings. |
| "Database setup is not complete" | A migration hasn't been run; run the missing file from `supabase/migrations/`. |
| Push notifications don't arrive | Check the VAPID keys and the iPhone app is installed to the home screen; resend from **More → Send test**. |
| Daily job returns 401 | `CRON_SECRET` is missing or different in Vercel; set it and redeploy. |
| Old icon or old version on a phone | Close and reopen the installed app; if it persists, remove it and add it again. |
| `git push` returns 403 | See Step 0 (repo access). |
