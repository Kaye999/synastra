// /api/cron/transit-scan — runs 6am UTC daily (see vercel.json).
//
// For each astral.profiles row with tier='depth':
//   1. Compute major transits in the next 30 days (via transit-detector).
//   2. Compare against already-sent alerts in astral.transit_alerts.
//   3. For each NEW transit: insert a row + email the user via Resend.
//
// Auth: `Authorization: Bearer <CRON_SECRET>`.
//
// ---------------------------------------------------------------
// SQL MIGRATION — run in Supabase SQL editor before enabling cron:
// ---------------------------------------------------------------
// create table astral.transit_alerts (
//   id uuid primary key default gen_random_uuid(),
//   user_id text not null,
//   transit_key text not null,           -- e.g. "jupiter-conj-natal-sun-2026-06-09"
//   transit_data jsonb not null,
//   alert_date date not null,
//   interpretation text,
//   sent_email_at timestamptz,
//   read_at timestamptz,
//   dismissed_at timestamptz,
//   created_at timestamptz default now(),
//   unique(user_id, transit_key)
// );
//
// -- RLS (user can only see own alerts; service role bypasses):
// alter table astral.transit_alerts enable row level security;
// create policy "own alerts read" on astral.transit_alerts
//   for select using (auth.uid()::text = user_id);
// create policy "own alerts update" on astral.transit_alerts
//   for update using (auth.uid()::text = user_id);
// ---------------------------------------------------------------

import { NextResponse } from 'next/server';
import {
  createCronSupabaseClient,
  toAstroInput,
  verifyCronAuth,
  type CronProfileRow,
} from '@/lib/cron/generate';
import { detectUpcomingTransits, interpretTransit, type TransitAlert } from '@/lib/cron/transits';
import { sendTransitAlertEmail } from '@/lib/email/transit-alert';
import type { Json } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type ClerkUserEmail = { email: string | null; firstName: string | null };

// Resolve the user's email + first name from Clerk's Backend API. We
// don't trust whatever's in our DB — Clerk is the source of truth for
// contact info.
async function fetchClerkEmail(userId: string): Promise<ClerkUserEmail> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return { email: null, firstName: null };
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    if (!res.ok) return { email: null, firstName: null };
    const user = (await res.json()) as {
      primary_email_address_id?: string;
      email_addresses?: Array<{ id: string; email_address: string }>;
      first_name?: string | null;
    };
    const primary = user.email_addresses?.find((e) => e.id === user.primary_email_address_id);
    return {
      email: primary?.email_address ?? user.email_addresses?.[0]?.email_address ?? null,
      firstName: user.first_name ?? null,
    };
  } catch (err) {
    console.warn('[cron/transit-scan] clerk lookup failed', userId, err);
    return { email: null, firstName: null };
  }
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const supabase = createCronSupabaseClient();

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('user_id, tier, first_name, birth_data')
    .eq('tier', 'depth');

  if (profilesErr) {
    console.error('[cron/transit-scan] profile fetch failed', profilesErr);
    return NextResponse.json({ error: 'profile-fetch-failed', detail: profilesErr.message }, { status: 500 });
  }

  const rows = (profiles ?? []) as CronProfileRow[];
  let scanned = 0;
  let newAlerts = 0;
  let emailsSent = 0;
  const errors: Array<{ user_id: string; message: string }> = [];

  for (const profile of rows) {
    scanned += 1;
    try {
      const chart = toAstroInput(profile.birth_data);
      if (!chart) {
        errors.push({ user_id: profile.user_id, message: 'no-birth-data' });
        continue;
      }

      const upcoming = await detectUpcomingTransits({ chart, windowDays: 30 });
      if (upcoming.length === 0) continue;

      // Pull existing alert keys for this user so we only insert new ones.
      const keys = upcoming.map((t) => t.transitKey);
      const { data: existingAlerts, error: existingErr } = await supabase
        .from('transit_alerts')
        .select('transit_key')
        .eq('user_id', profile.user_id)
        .in('transit_key', keys);

      if (existingErr) {
        errors.push({ user_id: profile.user_id, message: existingErr.message });
        continue;
      }

      const existingKeySet = new Set(
        ((existingAlerts ?? []) as Array<{ transit_key: string }>).map((r) => r.transit_key),
      );
      const newOnes = upcoming.filter((t) => !existingKeySet.has(t.transitKey));
      if (newOnes.length === 0) continue;

      // Lookup email/name once per user — only if we have new alerts to send.
      const clerkInfo = await fetchClerkEmail(profile.user_id);
      const firstName = clerkInfo.firstName || profile.first_name || '';

      for (const alert of newOnes) {
        const interpretation = interpretTransit(alert);

        // Send email first; record send timestamp on insert.
        let sentAt: string | null = null;
        if (clerkInfo.email) {
          const sendResult = await sendTransitAlertEmail({
            to: clerkInfo.email,
            firstName,
            alert,
            interpretation,
          });
          if (sendResult.error) {
            console.warn('[cron/transit-scan] email failed', profile.user_id, alert.transitKey, sendResult.error);
          } else {
            sentAt = new Date().toISOString();
            emailsSent += 1;
          }
        }

        const { error: insertErr } = await supabase
          .from('transit_alerts')
          .insert({
            user_id: profile.user_id,
            transit_key: alert.transitKey,
            transit_data: alert as unknown as Json,
            alert_date: alert.exactDate,
            interpretation,
            sent_email_at: sentAt,
          });

        if (insertErr) {
          // Unique constraint means another run just beat us; safe to ignore.
          if (!insertErr.message.includes('duplicate key')) {
            errors.push({ user_id: profile.user_id, message: insertErr.message });
            continue;
          }
        }
        newAlerts += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[cron/transit-scan] user failed', profile.user_id, message);
      errors.push({ user_id: profile.user_id, message });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned,
    newAlerts,
    emailsSent,
    errors,
  });
}

/* Note: Supabase's typed client doesn't yet know about the readings or
 * transit_alerts tables because the generated Database type is a
 * placeholder. We cast with `as never` at each call site above; swap
 * for real types once `supabase gen types typescript` is wired up. */
