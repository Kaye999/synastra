# Synastra — Work Backlog

**Load-bearing project doc.** Read before starting work. Update when you finish or discover items.

Last updated: 2026-05-18 by Ethan + Claude (audit session)

---

## How to use this doc

- **✅ Done** — shipped. Don't redo.
- **🟡 In progress / Partial / Blocked** — someone's on it or waiting on external.
- **⏳ Todo** — picked up next. Items at the top are higher priority.
- **🧊 Icebox** — deferred. Don't pull without owner approval.

If you start an item → change to 🟡 + add `(in progress: <name>, <date>)`.
If you finish → change to ✅ + add `(done: <PR link>, <date>)`.
If you discover new work → add to ⏳ with clear acceptance criteria.

---

## ✅ Done

### Product / scaffold
- ✅ Next.js 16 + React 19 + Tailwind 4 scaffold
- ✅ Clerk auth (`/sign-in`, `/sign-up`, `[[...catch-all]]`)
- ✅ Landing page (`src/app/page.tsx`)
- ✅ Marketing pages: `/about`, `/how-it-works`, `/privacy`, `/terms`, `/pricing`
- ✅ Onboarding flow (`/onboarding` — first-run chart capture)
- ✅ Birth-place autocomplete (Nominatim, in `CityAutocomplete.tsx`)
- ✅ `/chart` view — user's natal chart
- ✅ `/field-notes` blog + `[slug]` detail pages
- ✅ `/now` — ambient living-mirror surface (recent feature)
- ✅ Editorial design language (Starfield, Ornament, Reveal components)

### Readings (14 endpoints live)
- ✅ Western — full natal chart
- ✅ Vedic — nakshatras, pada, mahadasha
- ✅ Numerology — Expression, Soul Urge, Personal Year
- ✅ Kabbalah — Hebrew letters, sefirot, tarot paths
- ✅ Chinese BaZi — four pillars, day master, Nine Star Ki
- ✅ Human Design — type, strategy, authority, BodyGraph
- ✅ Ayurveda — `/api/reading/ayurveda` + `/api/ayurveda/submit`
- ✅ Enneagram — `/api/reading/enneagram` + `/api/enneagram/submit`
- ✅ Gene Keys — `/api/reading/gene-keys`
- ✅ Shadow work — `/api/reading/shadow`
- ✅ Wealth — `/api/reading/wealth`
- ✅ Life purpose — `/api/reading/life-purpose`
- ✅ Tarot — `/api/reading/tarot` (API exists; UI port from standalone HTML in BACKLOG below)
- ✅ Compatibility — `/api/reading/compatibility`

### AI + automation
- ✅ Oracle AI chat (`/api/chat` — 10 questions/day on paid tiers)
- ✅ Daily Guidance cron (`/api/cron/daily-guidance` — 0500 UTC daily)
- ✅ Transit Scan cron (`/api/cron/transit-scan` — 0600 UTC daily)
- ✅ Monthly Forecast cron (`/api/cron/monthly-forecast` — 0400 UTC monthly)
- ✅ Cron auth via `CRON_SECRET` bearer token

### Payments
- ✅ Stripe checkout flow (`/api/stripe/checkout`) — 2 tiers × 2 cadences = 4 price IDs
- ✅ Stripe webhook handler (`/api/stripe/webhook`)
- ✅ Pricing UI with monthly/yearly toggle + savings %

### Email
- ✅ Resend integration
- ✅ Email templates: `daily-digest.tsx`, `transit-alert.tsx`

### Infra
- ✅ Vercel deployed (per `vercel.json` + cron config)
- ✅ Supabase Postgres + supabase-js + SSR client
- ✅ 4 migration files (`supabase-migrations-v1..v4.sql`)
- ✅ `env.template` documented (Clerk + Supabase + Stripe + Anthropic + Resend + CRON_SECRET)

### Collaborator readiness (2026-05-18)
- ✅ `CLAUDE.md` — proper AI assistant context (this doc)
- ✅ `BACKLOG.md` — this file

---

## 🟡 In Progress / Partial / Blocked

### Uncommitted work on main (as of 2026-05-18)
- 🟡 8 modified files: `.gitignore`, `api/chat`, `api/profile`, `api/geocode`, `sign-in/sign-up` pages, `email/daily-digest`, `email/transit-alert`, `supabase/types.ts`, `lib/types.ts`, `CityAutocomplete`, `Onboarding`
- 🟡 1 untracked file: `supabase-migrations-v4.sql` (not committed!)
- 🟡 1 untracked directory: `src/app/settings/` (new feature?)
- **Action needed:** Ethan to commit, stash, or revert. Right now this is a fragile state.

### Blocked on owner action
- 🟡 **Confirm Stripe live mode price IDs in Vercel env** — code is correct; need 4 live price IDs:
  - `NEXT_PUBLIC_STRIPE_READER_MONTHLY`
  - `NEXT_PUBLIC_STRIPE_READER_ONETIME`
  - `NEXT_PUBLIC_STRIPE_DEPTH_MONTHLY` (note: env var name says "DEPTH" but tier renamed to "The Nine")
  - `NEXT_PUBLIC_STRIPE_DEPTH_ONETIME`
- 🟡 **Domain `getsynastra.com`** — confirm registered, DNS pointed at Vercel, SSL working
- 🟡 **Resend domain verification** — `getsynastra.com` SPF/DKIM/DMARC

### Open architectural decisions
- 🟡 **Env var rename: `STRIPE_DEPTH_*` → `STRIPE_NINE_*`** — should match the tier rename or keep current naming? Backward-compat vs cleanliness.

---

## ⏳ Todo (prioritised top-down)

### Priority 1 — Launch unblockers

#### ⏳ 1.1 Verify Stripe end-to-end in production
- **Why:** Memory references a recurring "Stripe blocker"; code looks correct but env may be incomplete.
- **How:**
  - Confirm 4 live price IDs set in Vercel Production env
  - Confirm `STRIPE_SECRET_KEY` live + `STRIPE_WEBHOOK_SECRET` live in Vercel
  - Run a $1 live test purchase on each tier × cadence (4 transactions)
  - Verify webhook fires + creates row in Supabase subscriptions table
- **Acceptance:** A real Stripe `cs_live_…` session completes for all 4 combinations and the user gets upgraded plan access

#### ⏳ 1.2 Triage uncommitted work
- **Why:** 8 modified + 3 untracked = fragile main. Can't safely deploy.
- **How:**
  - Read each diff, decide commit-vs-revert
  - Apply `supabase-migrations-v4.sql` to live (after review)
  - Decide if `src/app/settings/` is shippable or WIP
- **Acceptance:** Clean `git status` on main; v4 migration applied + recorded

#### ⏳ 1.3 Domain + email verification
- **Why:** Production deploy on a `*.vercel.app` URL won't convert; emails from unverified domain land in spam
- **How:**
  - Register `getsynastra.com` if not already
  - Point DNS at Vercel (A/CNAME records)
  - SSL auto-provisions via Vercel
  - In Resend dashboard: verify `getsynastra.com` (SPF/DKIM/DMARC TXT records)
- **Acceptance:** `https://getsynastra.com` resolves; test email from `noreply@getsynastra.com` lands in inbox (not spam)

#### ⏳ 1.4 Port tarot HTML into Synastra
- **Why:** Built `/Users/kaye/Projects/tarot/index.html` on 2026-05-17 — fully functional 3-card past/present/future spread with 78-card deck, shuffle, fly-out animation, and offline reading meanings. Currently standalone.
- **How:**
  - Wire the deck data + reading logic into `src/app/api/reading/tarot/route.ts` (currently a stub?)
  - Build React component for `/(reader)/tarot/page.tsx` (or wherever paid readings live)
  - Free tier: 1-card daily draw
  - Paid tiers: 3-card spread + (later) AI synthesis layered on top of the stored meanings
- **Acceptance:** Tarot reading page works in Synastra, gated by tier

### Priority 2 — Marketing / conversion

#### ⏳ 2.1 Content engine — STARR method daily posts
- **Why:** Synastra needs viral content to drive consumer acquisition. Owner has STARR method documented (`feedback_star_social_method`).
- **How:**
  - 1 short-form video per day (TikTok, IG Reels, YouTube Shorts)
  - 5-beat structure: Shocking · Text hook · Achievement · Road map · Recipe
  - Topic ideas auto-generated from cron output (today's transit, monthly forecast)
- **Acceptance:** 30 consecutive days of posts published; track signups attributed to social

#### ⏳ 2.2 Product Hunt launch
- **Why:** Memory references "PH launch was Tue" then delayed multiple times. Time to ship.
- **How:** Standard PH playbook — Hunter, gallery, first comment, support comments, OG image, launch day pricing bonus
- **Acceptance:** Listed live on PH, organic traffic measurable

#### ⏳ 2.3 SEO landing pages — one per tradition
- **Why:** 14 reading types = 14 SEO-targeted long-form pages (e.g. "/learn/human-design", "/learn/bazi")
- **How:** Server-rendered, schema.org markup, internal links from `/how-it-works`
- **Acceptance:** Each ranks for `[tradition] reading australia` within 90 days

#### ⏳ 2.4 Cancellation flow + retention saves
- **Why:** Subscription churn is the silent killer. Currently no offboarding flow.
- **How:** Cancel button → "Pause for 30 days?" → "20% off next month?" → confirm cancel
- **Acceptance:** Cancel rate drops measurably; pause+discount take rate > 0

### Priority 3 — Reading quality

#### ⏳ 3.1 Reading voice consistency audit
- **Why:** 14 reading endpoints written over weeks; voice may drift. Recent commit mentions "3-beat arc + macro-transit framing (Moon Omens shape)"
- **How:** Read all 14 outputs end-to-end on a single sample chart; flag inconsistencies; codify voice rules in shared prompt
- **Acceptance:** Voice guide doc at `docs/voice-guide.md`; all 14 readings updated to match

#### ⏳ 3.2 Disclaimer review across all readings
- **Why:** Wealth + Health (Ayurveda) readings are highest-risk for "this is advice" perception
- **How:** Audit every reading template for "you should", "this means [definitive statement]", etc. Replace with traditional/cultural framing.
- **Acceptance:** No reading makes a definitive financial/medical/legal claim. Disclaimer present on every output.

#### ⏳ 3.3 Compatibility reading — 2nd-chart capture flow
- **Why:** `/api/reading/compatibility` exists but the UI for capturing the second person's birth data isn't clear
- **How:** Standard composite/synastry flow — share link, enter partner data, both consent
- **Acceptance:** User can complete a compatibility reading without confusion

### Priority 4 — Polish + scale

#### ⏳ 4.1 Generate Supabase TS types
- **Why:** Currently `lib/supabase/types.ts` is hand-written. Drift risk.
- **How:** `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts`
- **Acceptance:** Types regenerated, callers refactored

#### ⏳ 4.2 Tests (Vitest + Playwright)
- **Why:** Zero tests currently. Reading endpoints especially fragile to prompt drift.
- **How:** Vitest for `lib/*`. Playwright for: signup → onboarding → free reading.
- **Acceptance:** `npm test` passes; CI enforces

#### ⏳ 4.3 Performance audit (Lighthouse > 90 everywhere)
- **Why:** Astrology audience skews mobile; perf matters for conversion
- **How:** Run Lighthouse on `/`, `/pricing`, `/sign-up`, `/chart`, `/now`. Address regressions.
- **Acceptance:** All 5 pages Lighthouse > 90

#### ⏳ 4.4 GA4 / Plausible analytics
- **Why:** No instrumentation to know what's converting
- **How:** Privacy-respecting choice — Plausible or PostHog or basic Vercel Analytics (already installed!)
- **Acceptance:** Funnel events tracked: visit → signup → onboarding complete → upgrade

#### ⏳ 4.5 Collaborator readiness — CONTRIBUTING.md
- **Why:** Have CLAUDE.md + BACKLOG.md; missing the PR conventions doc
- **How:** Mirror LeadM8 `CONTRIBUTING.md` adapted for Synastra
- **Acceptance:** File exists; covers branching, commits, PR template, secrets, DB rules

---

## 🧊 Icebox (deliberately deferred)

- Native iOS / Android app (web works fine on mobile; native is post-PMF)
- B2B angle — partnering with yoga studios / wellness apps for white-label
- Live 1-on-1 reading marketplace (regulatory + operational complexity)
- NFT-based "soul archetype" collectible (web3 vibes, not worth the brand risk yet)
- Voice / audio readings (would need Speak-style TTS, real cost per minute)
- 13th tradition (Mayan / Aboriginal Australian / etc.) — only after The Nine PMF
- Group / family compatibility readings (>2 people) — niche
