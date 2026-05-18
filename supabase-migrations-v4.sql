-- Synastra — v4 migrations
--
-- Run in the Supabase SQL Editor *after* v3. Adds monthly chat-quota tracking
-- columns referenced by /api/chat — daily quota already exists from v2/v3.
--
-- Tiered limits enforced in /api/chat:
--   free   -> 5 / day, 30 / month
--   reader -> 50 / day, 300 / month
--   depth  -> unlimited
--
-- Idempotent: uses `add column if not exists`.

alter table astral.profiles
  add column if not exists chat_quota_used_this_month  integer not null default 0,
  add column if not exists chat_quota_month_reset_at   timestamptz;

-- Backfill: seed month_reset_at to the start of next UTC month so the first
-- request after migration doesn't treat NULL as "needs reset" against unbounded
-- past usage.
update astral.profiles
  set chat_quota_month_reset_at = date_trunc('month', now()) + interval '1 month'
  where chat_quota_month_reset_at is null;

-- Grant read/write on the new columns to the authenticated role.
grant select (chat_quota_used_this_month, chat_quota_month_reset_at)
  on astral.profiles to authenticated;
grant update (chat_quota_used_this_month, chat_quota_month_reset_at)
  on astral.profiles to authenticated;
