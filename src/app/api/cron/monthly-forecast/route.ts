// /api/cron/monthly-forecast — runs 4am UTC on the 1st of each month
// (see vercel.json). For each profile with tier in ('reader', 'depth'),
// pre-generate the monthly forecast so it's cached before the user
// opens the dashboard.
//
// Auth: `Authorization: Bearer <CRON_SECRET>`.

import { NextResponse } from 'next/server';
import {
  createCronSupabaseClient,
  generateMonthlyForecast,
  thisMonthIsoDate,
  verifyCronAuth,
  type CronProfileRow,
} from '@/lib/cron/generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Monthly run may be long — generating forecasts for every paying user
// at once. Vercel Hobby caps at 300s; Pro goes higher.
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const supabase = createCronSupabaseClient();
  const monthStart = thisMonthIsoDate();

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('user_id, tier, first_name, birth_data')
    .in('tier', ['reader', 'depth']);

  if (profilesErr) {
    console.error('[cron/monthly-forecast] profile fetch failed', profilesErr);
    return NextResponse.json({ error: 'profile-fetch-failed', detail: profilesErr.message }, { status: 500 });
  }

  const rows = (profiles ?? []) as CronProfileRow[];
  let generated = 0;
  let skipped = 0;
  const errors: Array<{ user_id: string; message: string }> = [];

  for (const profile of rows) {
    try {
      const { data: existing } = await supabase
        .from('readings')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('reading_type', 'monthly')
        .eq('reading_date', monthStart)
        .maybeSingle();

      if (existing) {
        skipped += 1;
        continue;
      }

      const forecast = await generateMonthlyForecast({ profile, monthStart });
      if (!forecast) {
        errors.push({ user_id: profile.user_id, message: 'generation-returned-null' });
        continue;
      }

      const { error: insertErr } = await supabase
        .from('readings')
        .insert({
          user_id: profile.user_id,
          reading_type: forecast.reading_type,
          reading_date: forecast.reading_date,
          title: forecast.title,
          body: forecast.body,
          meta: forecast.meta,
        });

      if (insertErr) {
        errors.push({ user_id: profile.user_id, message: insertErr.message });
        continue;
      }

      generated += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[cron/monthly-forecast] user failed', profile.user_id, message);
      errors.push({ user_id: profile.user_id, message });
    }
  }

  return NextResponse.json({
    ok: true,
    monthStart,
    scanned: rows.length,
    generated,
    skipped,
    errors,
  });
}
