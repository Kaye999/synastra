-- Synastra — v5 migrations
--
-- Run in the Supabase SQL Editor *after* v4. This migration unblocks three
-- things that runtime code already expects but the DB never received:
--
--   1. astral.transit_alerts — the transit-scan cron (/api/cron/transit-scan)
--      inserts/queries this table, but it only ever existed as a commented-out
--      CREATE in that route's header. Without it the transit email pipeline
--      cannot run.
--   2. Email-preference columns on astral.profiles — needed for a functional
--      unsubscribe (Australian Spam Act 2003) before the email engine sends.
--   3. monthly_quota_used / monthly_quota_month — reading-runtime.ts SELECTs
--      and UPDATEs these to enforce the reader-tier monthly cap; their absence
--      means the cap is currently unenforced.
--
-- Idempotent: `create table if not exists` / `add column if not exists` /
-- `drop policy if exists` — safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Transit alerts table
-- ---------------------------------------------------------------------------
-- Shape matches the spec in src/app/api/cron/transit-scan/route.ts. The cron
-- writes here via the service-role client (bypasses RLS). RLS is enabled as a
-- secure default — note Synastra uses Clerk, not Supabase auth, so auth.uid()
-- is null for app requests; these policies deny authenticated-role access
-- entirely, which is the intended posture (only the cron touches this table).

create table if not exists astral.transit_alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  transit_key   text not null,           -- e.g. "jupiter-conj-natal-sun-2026-06-09"
  transit_data  jsonb not null,
  alert_date    date not null,
  interpretation text,
  sent_email_at timestamptz,
  read_at       timestamptz,
  dismissed_at  timestamptz,
  created_at    timestamptz default now(),
  unique (user_id, transit_key)
);

create index if not exists transit_alerts_user_idx
  on astral.transit_alerts (user_id);

alter table astral.transit_alerts enable row level security;

drop policy if exists "own alerts read" on astral.transit_alerts;
create policy "own alerts read" on astral.transit_alerts
  for select using (auth.uid()::text = user_id);

drop policy if exists "own alerts update" on astral.transit_alerts;
create policy "own alerts update" on astral.transit_alerts
  for update using (auth.uid()::text = user_id);

-- ---------------------------------------------------------------------------
-- 2. Email-preference columns + unsubscribe token
-- ---------------------------------------------------------------------------
-- Defaults are TRUE: recurring reading emails are part of the paid product, so
-- consent is inferred from the subscription. The unsubscribe flow flips these
-- to FALSE. A functional unsubscribe + these flags satisfy the Spam Act.

alter table astral.profiles
  add column if not exists email_daily_opt_in    boolean not null default true,
  add column if not exists email_monthly_opt_in  boolean not null default true,
  add column if not exists email_transit_opt_in  boolean not null default true,
  add column if not exists unsubscribe_token     text;

-- Backfill: every existing row needs a stable unsubscribe token so old users
-- get a working one-click unsubscribe link.
update astral.profiles
  set unsubscribe_token = gen_random_uuid()::text
  where unsubscribe_token is null;

-- New rows get a token automatically from here on.
alter table astral.profiles
  alter column unsubscribe_token set default gen_random_uuid()::text;

create unique index if not exists profiles_unsubscribe_token_idx
  on astral.profiles (unsubscribe_token);

-- ---------------------------------------------------------------------------
-- 3. Monthly reading-quota columns
-- ---------------------------------------------------------------------------
-- reading-runtime.ts: monthly_quota_month is 'YYYY-MM'; a mismatch with the
-- current month is treated as zero usage, so no backfill is required.

alter table astral.profiles
  add column if not exists monthly_quota_used   integer not null default 0,
  add column if not exists monthly_quota_month  text;

-- ---------------------------------------------------------------------------
-- Grants — match the v2–v4 pattern for the new astral.profiles columns.
-- transit_alerts is intentionally NOT granted to `authenticated`: only the
-- service-role cron reads/writes it.
-- ---------------------------------------------------------------------------
grant select (email_daily_opt_in, email_monthly_opt_in, email_transit_opt_in,
              unsubscribe_token, monthly_quota_used, monthly_quota_month)
  on astral.profiles to authenticated;
grant update (email_daily_opt_in, email_monthly_opt_in, email_transit_opt_in,
              monthly_quota_used, monthly_quota_month)
  on astral.profiles to authenticated;
