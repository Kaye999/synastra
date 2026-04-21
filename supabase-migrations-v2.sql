-- Synastra — v2 migrations
--
-- Run in the Supabase SQL Editor *after* the v1 migrations have been applied.
-- Adds jsonb columns for the two newly-shipped quiz-based traditions:
--   · enneagram → scored EnneagramResult + raw answers + taken_at + version
--   · ayurveda  → scored Prakruti         + raw answers + completed_at + version
--
-- Both shapes are already persisted by /api/enneagram/submit and
-- /api/ayurveda/submit (see those routes for the exact payload). The
-- completed_at / taken_at fields live inside the jsonb blob; no separate
-- timestamp columns are required.
--
-- Idempotent: `add column if not exists` — safe to re-run.

alter table astral.profiles
  add column if not exists enneagram jsonb,
  add column if not exists ayurveda  jsonb;

-- Optional: helpful indexes for fast "have they completed the quiz?" checks.
-- These are cheap on jsonb-null-or-present and speed up the profile GET.
create index if not exists profiles_enneagram_present_idx
  on astral.profiles ((enneagram is not null));

create index if not exists profiles_ayurveda_present_idx
  on astral.profiles ((ayurveda is not null));

-- Grant read on the new columns to the authenticated role (other columns
-- already inherit this; we call it out explicitly so the migration is
-- self-documenting).
grant select (enneagram, ayurveda) on astral.profiles to authenticated;
grant update (enneagram, ayurveda) on astral.profiles to authenticated;
