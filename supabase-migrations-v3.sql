-- Synastra — v3 migrations
--
-- Run in the Supabase SQL Editor *after* v2. These columns are referenced by
-- runtime code but were never shipped to the DB — their absence 500s both
-- /api/profile (upsert writes first_name) and /api/reading/* (loadProfile
-- SELECTs first_name, chat_quota_reset_at).
--
-- Idempotent: uses `add column if not exists`.

alter table astral.profiles
  add column if not exists first_name             text,
  add column if not exists chat_quota_reset_at    timestamptz,
  add column if not exists payment_failed         boolean not null default false;

-- Backfill: if any rows exist, seed reset_at to now() so the chat quota
-- check doesn't treat NULL as "needs reset" on unbounded history.
update astral.profiles
  set chat_quota_reset_at = now()
  where chat_quota_reset_at is null;

-- Grant read/write on the new columns to the authenticated role.
grant select (first_name, chat_quota_reset_at, payment_failed)
  on astral.profiles to authenticated;
grant update (first_name, chat_quota_reset_at, payment_failed)
  on astral.profiles to authenticated;
