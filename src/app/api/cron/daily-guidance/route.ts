// /api/cron/daily-guidance — runs 5am UTC daily (see vercel.json).
//
// For each astral.profiles row with tier !== 'free', ensures a
// `readings` row exists for today's date + reading_type='daily'. If
// missing, calls the shared generator and inserts it.
//
// Purpose: the user's Morning Cup loads instantly from the cache on
// first page load; Claude isn't in the request path.
//
// Auth: Vercel cron sends `Authorization: Bearer <CRON_SECRET>`.
//
// Response: JSON summary { scanned, generated, skipped, errors }.

import { NextResponse } from 'next/server';
import {
  createCronSupabaseClient,
  generateDailyReading,
  todayIsoDate,
  verifyCronAuth,
  type CronProfileRow,
} from '@/lib/cron/generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 5 min so we can iterate a few hundred users sequentially
// without hitting the default 10s function timeout.
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const supabase = createCronSupabaseClient();
  const today = todayIsoDate();

  // Pull every non-free profile. For now we stream them sequentially;
  // swap to a paginated cursor once we cross ~500 users.
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('user_id, tier, first_name, birth_data')
    .neq('tier', 'free');

  if (profilesErr) {
    console.error('[cron/daily-guidance] profile fetch failed', profilesErr);
    return NextResponse.json({ error: 'profile-fetch-failed', detail: profilesErr.message }, { status: 500 });
  }

  const rows = (profiles ?? []) as CronProfileRow[];
  let generated = 0;
  let skipped = 0;
  const errors: Array<{ user_id: string; message: string }> = [];

  for (const profile of rows) {
    try {
      // Check if today's daily reading already exists.
      const { data: existing } = await supabase
        .from('readings')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('reading_type', 'daily')
        .eq('reading_date', today)
        .maybeSingle();

      if (existing) {
        skipped += 1;
        continue;
      }

      const reading = await generateDailyReading({ profile, today });
      if (!reading) {
        errors.push({ user_id: profile.user_id, message: 'generation-returned-null' });
        continue;
      }

      const { error: insertErr } = await supabase
        .from('readings')
        .insert({
          user_id: profile.user_id,
          reading_type: reading.reading_type,
          reading_date: reading.reading_date,
          title: reading.title,
          body: reading.body,
          meta: reading.meta,
        });

      if (insertErr) {
        errors.push({ user_id: profile.user_id, message: insertErr.message });
        continue;
      }

      generated += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[cron/daily-guidance] user failed', profile.user_id, message);
      errors.push({ user_id: profile.user_id, message });
    }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    scanned: rows.length,
    generated,
    skipped,
    errors,
  });
}
