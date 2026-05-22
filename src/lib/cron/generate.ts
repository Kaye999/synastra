// Shared reading-generation helpers used by both the on-demand API routes
// (src/app/api/reading/*) and the nightly cron jobs (src/app/api/cron/*).
//
// The cron path pre-generates readings so the user's Morning Cup / Monthly
// Forecast loads instantly without triggering Claude on first page load.
//
// NOTE — the interp/prompt authors ship `generateDailyReading`,
// `generateMonthlyForecast`, and chart-computation glue via their own
// modules. This file intentionally wraps those as optional imports so the
// cron build doesn't break while those modules are in flight. When the
// reading-engines agent lands their modules, uncomment the real imports
// and remove the placeholder fallbacks at the bottom of the file.

import Anthropic from '@anthropic-ai/sdk';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/lib/supabase/types';
import type { AstroInput, BirthData, Tier } from '@/lib/types';
import {
  computeTropicalChart,
  computeSiderealChart,
  computeMahadasha,
} from '@/lib/engines/astro';

/* ============================================================
 * Cron-extended Database type
 * ============================================================
 *
 * The base `Database` type in `src/lib/supabase/types.ts` is a
 * placeholder that only knows about `profiles`. Cron jobs also touch
 * `readings` and `transit_alerts` — we extend the schema type locally
 * so the fluent builder stays typed without forcing the placeholder
 * types module to be rewritten by another agent's scope. Once the real
 * generated types ship via `supabase gen types typescript`, delete this
 * block and import `Database` directly.
 */
type ReadingRow = {
  id: string;
  user_id: string;
  reading_type: string;
  reading_date: string;
  title: string | null;
  body: string;
  meta: Json;
  created_at: string;
};

type TransitAlertRow = {
  id: string;
  user_id: string;
  transit_key: string;
  transit_data: Json;
  alert_date: string;
  interpretation: string | null;
  sent_email_at: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  user_id: string;
  tier: Tier;
  birth_data: Json;
  first_name: string | null;
  chat_quota_used_today: number | null;
  chat_quota_reset_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CronDatabase = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  astral: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'user_id' | 'birth_data'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      readings: {
        Row: ReadingRow;
        Insert: Partial<ReadingRow> & Pick<ReadingRow, 'user_id' | 'reading_type' | 'reading_date' | 'body'>;
        Update: Partial<ReadingRow>;
        Relationships: [];
      };
      transit_alerts: {
        Row: TransitAlertRow;
        Insert: Partial<TransitAlertRow> & Pick<TransitAlertRow, 'user_id' | 'transit_key' | 'transit_data' | 'alert_date'>;
        Update: Partial<TransitAlertRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/* ============================================================
 * Service-role Supabase client (cron-only)
 * ============================================================
 *
 * Cron jobs run without a user session, so we can't use the cookie-bound
 * `createSupabaseServerClient`. We use the service role key to bypass RLS
 * and read/write any profile.
 *
 * SECURITY — this key must NEVER be exposed to the browser. The cron
 * routes are the only callers; they also gate on CRON_SECRET before
 * reaching any Supabase code here.
 */
export function createCronSupabaseClient(): SupabaseClient<CronDatabase, 'astral'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('[cron] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient<CronDatabase, 'astral'>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // We target the `astral` schema throughout cron logic. Callers can
    // override via `.schema('public')` where needed.
    db: { schema: 'astral' },
  });
}

/* ============================================================
 * Anthropic client
 * ============================================================ */

const MODEL = 'claude-sonnet-4-6';

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('[cron] ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

/* ============================================================
 * Profile shape (cron reads a minimal projection)
 * ============================================================ */

export type CronProfileRow = {
  user_id: string;
  tier: Tier;
  first_name: string | null;
  birth_data: Json;
};

/* ============================================================
 * Date helpers
 * ============================================================ */

/** Today's date in YYYY-MM-DD (UTC). Cron runs at a fixed UTC hour so we
 * key by UTC date, not user-local. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** First-of-month in YYYY-MM-01 (UTC). */
export function thisMonthIsoDate(): string {
  const d = new Date();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${d.getUTCFullYear()}-${m}-01`;
}

/* ============================================================
 * Birth-data → AstroInput coercion
 * ============================================================
 *
 * `profiles.birth_data` is stored as JSON. The UI onboarding resolves
 * city → lat/lon/tz. We expect the stored shape to be either the full
 * BirthData (with lat/lon/tzOffset embedded) or the original BirthData
 * plus a sibling `coords` object. Defensive parsing below.
 */
export function toAstroInput(birthData: Json): AstroInput | null {
  if (!birthData || typeof birthData !== 'object' || Array.isArray(birthData)) return null;
  const b = birthData as Record<string, Json>;

  const dob = b.dob as BirthData['dob'] | undefined;
  const time = b.time as BirthData['time'] | undefined;
  if (!dob || !time) return null;

  // lat/lon/tzOffset may be at top level or inside `coords`.
  let lat: number | undefined;
  let lon: number | undefined;
  let tzOffset: number | undefined;
  if (typeof b.lat === 'number' && typeof b.lon === 'number') {
    lat = b.lat;
    lon = b.lon;
    tzOffset = typeof b.tzOffset === 'number' ? b.tzOffset : 0;
  } else if (b.coords && typeof b.coords === 'object' && !Array.isArray(b.coords)) {
    const c = b.coords as Record<string, Json>;
    if (typeof c.lat === 'number' && typeof c.lon === 'number') {
      lat = c.lat;
      lon = c.lon;
      tzOffset = typeof c.tzOffset === 'number' ? c.tzOffset : 0;
    }
  }
  if (lat == null || lon == null) return null;

  return {
    dob,
    time,
    timeUnknown: Boolean(b.timeUnknown),
    lat,
    lon,
    tzOffset: tzOffset ?? 0,
  };
}

/* ============================================================
 * Daily guidance generation
 * ============================================================
 *
 * The on-demand route `/api/reading/daily` should import and call
 * `generateDailyReading` below so the logic is identical between
 * request-time and pre-generation. Cron pre-fills the cache; the UI
 * route reads the cached row.
 */

export type DailyReading = {
  reading_type: 'daily';
  reading_date: string; // YYYY-MM-DD
  body: string;
  title: string | null;
  meta: Json;
};

const DAILY_SYSTEM = `You are the Synastra oracle — reading across Western, Vedic, numerology, Kabbalah, Human Design, Tarot and Astrocartography.

Write the user a single-day reading for today, grounded in their natal chart and today's transits. Voice: editorial, observational, concise, no hedging, no emoji. Short + long sentences. 2-3 paragraphs max. Include ONE concrete image or metaphor. End with a single-sentence invitation ("Today, ...").

If the user's time of birth is unknown, stick to signs + transits, not houses.`;

export async function generateDailyReading(args: {
  profile: CronProfileRow;
  today?: string;
}): Promise<DailyReading | null> {
  const today = args.today ?? todayIsoDate();
  const input = toAstroInput(args.profile.birth_data);
  if (!input) return null;

  const tropical = computeTropicalChart(input);
  const sidereal = computeSiderealChart(input);

  const anthropic = getAnthropic();
  const userPrompt = [
    `First name: ${args.profile.first_name || 'friend'}`,
    `Date: ${today}`,
    `Tropical placements: ${JSON.stringify(tropical.planets.map((p) => ({ p: p.planet, s: p.sign, d: Math.round(p.deg) })))}`,
    sidereal.nakshatra
      ? `Moon nakshatra: ${sidereal.nakshatra.name} pada ${sidereal.nakshatra.pada}`
      : '',
    tropical.ascendant ? `Ascendant: ${tropical.ascendant.sign} ${Math.round(tropical.ascendant.deg)}°` : 'Ascendant: unknown (birth time not provided)',
  ]
    .filter(Boolean)
    .join('\n');

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: DAILY_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const body = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n\n')
    .trim();

  if (!body) return null;

  return {
    reading_type: 'daily',
    reading_date: today,
    title: null,
    body,
    meta: {
      model: MODEL,
      generated_at: new Date().toISOString(),
      source: 'cron',
    } satisfies Record<string, Json>,
  };
}

/* ============================================================
 * Monthly forecast
 * ============================================================ */

export type MonthlyForecast = {
  reading_type: 'monthly';
  reading_date: string; // YYYY-MM-01
  body: string;
  title: string | null;
  meta: Json;
};

const MONTHLY_SYSTEM = `You are the Synastra oracle. Write a month-at-a-glance forecast for the user: arc of the month in 4-5 paragraphs, keyed to their natal placements and the major transits of the coming 30 days. Name specific days when something shifts (full moons, ingresses, retrogrades, outer-planet contacts to natal points). Voice: editorial, concrete, no hedging, no emoji. End with a single headline sentence for the month.`;

export async function generateMonthlyForecast(args: {
  profile: CronProfileRow;
  monthStart?: string;
}): Promise<MonthlyForecast | null> {
  const monthStart = args.monthStart ?? thisMonthIsoDate();
  const input = toAstroInput(args.profile.birth_data);
  if (!input) return null;

  const tropical = computeTropicalChart(input);
  const sidereal = computeSiderealChart(input);
  const birthDate = new Date(Date.UTC(input.dob.y, input.dob.m - 1, input.dob.d));
  const mahadasha = sidereal.nakshatra
    ? computeMahadasha(sidereal.planets.find((p) => p.planet === 'Moon')?.longitude ?? 0, birthDate)
    : null;

  const anthropic = getAnthropic();
  const userPrompt = [
    `First name: ${args.profile.first_name || 'friend'}`,
    `Month starting: ${monthStart}`,
    `Tropical chart: ${JSON.stringify({
      planets: tropical.planets.map((p) => ({ p: p.planet, s: p.sign, d: Math.round(p.deg), h: p.house })),
      asc: tropical.ascendant?.sign,
      mc: tropical.mc?.sign,
    })}`,
    mahadasha ? `Current mahadasha: ${mahadasha.currentLord} (→ ${mahadasha.currentEnd.toISOString().slice(0, 10)})` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1600,
    system: MONTHLY_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const body = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('\n\n')
    .trim();

  if (!body) return null;

  return {
    reading_type: 'monthly',
    reading_date: monthStart,
    title: null,
    body,
    meta: {
      model: MODEL,
      generated_at: new Date().toISOString(),
      source: 'cron',
    } satisfies Record<string, Json>,
  };
}

/* ============================================================
 * Cron auth
 * ============================================================
 *
 * Vercel cron sends `Authorization: Bearer <CRON_SECRET>` automatically
 * when the env var is set. Rotate the secret from the Vercel dashboard
 * to revoke access.
 */
export function verifyCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  return header === `Bearer ${secret}`;
}

/* ============================================================
 * SQL — astral.readings
 * ============================================================
 *
 * Expected schema (create in Supabase if not already done by the
 * reading-engines agent):
 *
 *   create table astral.readings (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id text not null,
 *     reading_type text not null,     -- 'daily' | 'monthly' | 'compatibility' | ...
 *     reading_date date not null,     -- day for 'daily'; 1st-of-month for 'monthly'
 *     title text,
 *     body text not null,
 *     meta jsonb not null default '{}'::jsonb,
 *     created_at timestamptz default now(),
 *     unique(user_id, reading_type, reading_date)
 *   );
 */
