# Synastra — Repo Context for AI Assistants

This file is auto-loaded by Claude Code (and read by other AI assistants). Anything you need to know to be useful in this repo lives here or is one link away.

> **First-time?** Read this file → then `AGENTS.md` → then `BACKLOG.md`.

---

## What this product is

**Synastra** is a consumer astrology + esoteric-traditions SaaS — a single natal chart cross-read through **7 wisdom traditions** (Western, Vedic, Numerology, Kabbalah, Human Design, Tarot, Astrocartography), plus a daily AI-written guidance feed, a monthly forecast, and a **Master Oracle AI** (Tier 3) trained across all 7 traditions, general astrology, astronomy, and traditional archetypes.

**Tagline:** *Seven traditions. One chart. One Oracle.*

### Pricing — locked (re-priced + added The Nine 2026-05-21)
| Tier | Monthly | Yearly | What you get |
|------|---------|--------|--------------|
| **The Two** | Free | Free | Western (Sun/Moon/Rising) + Numerology preview · daily planet · daily affirmation · weekly aspect · 3 Oracle questions/day teaser |
| **The Five** | A$11.10 | A$77.70 | + Vedic (Lagna, Nakshatra, mahadasha), Kabbalah, Human Design · daily guidance · monthly forecast · 10 Oracle questions/day |
| **The Seven** | A$22.20 | A$155.40 | + Tarot, Astrocartography · transit alerts · compatibility · cross-tradition synthesis · **unlimited Master Oracle** (expert across all 7 traditions + general astrology + astronomy + traditional archetypes) |
| **The Nine** | A$33.30 | A$233.10 | + Sun · Moon · Rising trinity personalisation · Monthly Zodiac Season Workbook PDF · 2 guided meditation audios/mo · New & Full Moon ceremonies · printable Moon journals |

**Tier codenames in code/DB:** `free` → The Two · `reader` → The Five · `depth` → The Seven · `master` → The Nine.

**Don't propose pricing changes** without owner approval. **Rebrand history:** 12 traditions (Three/Six/Nine) → 7 traditions (Two/Five/Seven) on 2026-05-18 · re-priced and added The Nine on 2026-05-21 (Moon Omens-inspired ritual layer). Cut traditions in 12→7 collapse: BaZi (Chinese), Mayan Tzolk'in, Enneagram, Gene Keys, Ayurveda. Engine files for the cut traditions remain in `src/lib/engines/` for future optionality but are not wired into the UI.

---

## Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | **Next.js 16** (App Router) | ⚠️ Many breaking changes from training data — see `AGENTS.md` |
| React | React 19.2.4 | Server Components by default |
| Styling | Tailwind v4 | Editorial / mystical aesthetic; starfield bg via `<Starfield />` |
| Auth | **Clerk** | NOT Supabase auth (different from LeadM8) |
| DB | Supabase Postgres | Schema lives at `supabase-migrations-v*.sql` |
| Payments | Stripe Subscriptions + one-time | Both monthly + yearly cadences supported |
| Hosting | **Vercel** | Live (per `vercel.json`); 3 cron jobs running |
| Email | **Resend** | Transactional + digest emails |
| AI | Anthropic SDK | All readings + chat use Claude |
| Astronomy | `astronomy-engine` npm package | Local computation; no external API for charts |
| Geocoding | Nominatim (OpenStreetMap) | Free, no key needed |

---

## Routes

### Marketing (public)
- `/` — landing (`src/app/page.tsx`)
- `/(marketing)/about`
- `/(marketing)/how-it-works`
- `/(marketing)/privacy`
- `/(marketing)/terms`
- `/pricing`
- `/field-notes` + `/field-notes/[slug]` — blog
- `/now` — ambient living-mirror surface (recent feature)

### Authed
- `/sign-in/[[...sign-in]]` · `/sign-up/[[...sign-up]]` (Clerk)
- `/onboarding` — first-run chart capture
- `/chart` — user's natal chart
- `/settings` — profile + plan management

### API — readings (14 of them)
- `/api/reading/daily` · `/api/reading/monthly` · `/api/reading/transit-alerts`
- `/api/reading/ayurveda` · `/api/reading/enneagram` · `/api/reading/gene-keys`
- `/api/reading/shadow` · `/api/reading/wealth` · `/api/reading/life-purpose`
- `/api/reading/tarot` · `/api/reading/compatibility`

### API — other
- `/api/chat` — Oracle AI chat (10 questions/day on paid tiers)
- `/api/profile` — user profile CRUD
- `/api/geocode` — birth-place autocomplete via Nominatim
- `/api/stripe/checkout` — creates Stripe Checkout Session
- `/api/stripe/webhook` — handles subscription events
- `/api/ayurveda/submit` · `/api/enneagram/submit` — questionnaire intake

### Cron (Vercel cron, defined in `vercel.json`)
- `/api/cron/daily-guidance` — 0500 UTC every day
- `/api/cron/transit-scan` — 0600 UTC every day
- `/api/cron/monthly-forecast` — 0400 UTC on the 1st of each month

All crons must check `Authorization: Bearer ${CRON_SECRET}` to reject unauthorised hits.

---

## Directory layout (key paths)

```
src/
├── app/                   # Next.js App Router
│   ├── (marketing)/       # Route group for public marketing pages
│   ├── _marketing/        # Shared marketing components (Reveal, etc.)
│   ├── api/               # See "Routes — API" above
│   ├── chart/
│   ├── field-notes/
│   ├── now/
│   ├── onboarding/
│   ├── pricing/           # PricingCards-style UI (3-tier with cadence toggle)
│   ├── settings/          # ← uncommitted as of 2026-05-18
│   └── sign-in / sign-up/
├── components/
│   ├── Starfield.tsx      # Animated star background
│   ├── Ornament.tsx       # Editorial flourishes
│   └── CityAutocomplete.tsx
└── lib/
    ├── stripe.ts          # Stripe client + TIERS config + tierKey()
    ├── supabase/          # browser, server, types clients
    ├── email/             # Resend templates (daily-digest, transit-alert, etc.)
    └── types.ts

supabase-migrations-v1..v4.sql  # Versioned migrations (root, not in supabase/migrations/)
```

---

## Hard rules

1. **Never push to `main`** — branch + PR. See `CONTRIBUTING.md`.
2. **Never commit `.env*` files.**
3. **Tarot, daily, monthly readings are not financial / medical / legal advice** — every reading must include disclaimer; never write definitive statements about money, health, relationships in a way that implies professional advice.
4. **No new pricing tiers / changes without owner approval.**
5. **No new dependencies without owner approval.**
6. **Never expose Clerk secret keys or Supabase service-role keys to the browser.**
7. **Cron endpoints must validate `CRON_SECRET`** — unauthenticated requests to `/api/cron/*` must return 401.
8. **Reading prompts go to Claude (Anthropic), not OpenAI** — even if you see other SDK code, this project is Anthropic-only.

---

## Where to find things

- Live state, backlog, who owns what → **`BACKLOG.md`** (load-bearing — read before starting work)
- PR conventions, commit format → **`CONTRIBUTING.md`**
- Next.js 16-specific gotchas → **`AGENTS.md`**
- env vars list → **`env.template`** (already exists, well-documented)
- DB schema → `supabase-migrations-v*.sql` at repo root

---

## What you (the AI) can do without asking

- Read any file in the repo
- Run `npm install`, `npm run dev`, `npm run lint`, `npm run build`
- Create branches, commit, push, open PRs (following `CONTRIBUTING.md`)
- Query the Supabase project via service role (when configured)
- Suggest UI / copy / code / reading-prompt improvements

## What you (the AI) must NOT do without explicit approval

- Apply migrations to production Supabase — only owner runs SQL on prod
- Touch live Stripe (live keys → live products / customers)
- Merge your own PRs
- Push directly to `main`
- Add/upgrade dependencies
- Change pricing copy or tier features
- Send live emails via Resend (use test mode or sandbox addresses for dev)
- Modify the disclaimer / not-financial-advice / not-medical-advice language anywhere

---

## Reporting back

When you finish a task, your PR description should include:
- **What** changed (one sentence)
- **Why** (link to BACKLOG.md entry)
- **How tested** (specific steps for a reviewer)
- **Risk** (what could break)
- **Follow-ups** (new tasks discovered — add to `BACKLOG.md`)

---

Owner: Ethan Kay · ethankay2307@gmail.com
Last reviewed: 2026-05-18
