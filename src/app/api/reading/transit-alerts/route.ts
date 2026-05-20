// /api/reading/transit-alerts
//   GET  -> list upcoming transit alerts for next 30 days (depth only).
//          Each alert includes planet, aspect, target, exactDate, orb window,
//          and any pre-generated reading body if cached.
//   POST -> body { alertId, action: 'dismiss' } — marks a cached alert as
//          dismissed (stored in scope_key suffix). Idempotent.
//
// Alerts live as individual rows in astral.readings with reading_type
// 'transit-alert' and scope_key = `${planet}|${aspect}|${target}|${exactIso}`.
// The row body is the generated reading text, which may be empty string if
// the background job hasn't generated it yet.
//
// This route generates readings on-demand for alerts that don't yet have a
// body (first GET after detection). To stream a single alert instead, pass
// ?generate=<scope_key>.

import type { BirthData, Chart } from '@/lib/types';
import { computeTropicalChart } from '@/lib/engines/astro';
import {
  authenticated,
  birthDataToAstroInput,
  getCachedReading,
  hasTier,
  loadProfile,
  replayCachedAsStream,
  saveCachedReading,
  streamReading,
  upgradeResponse,
} from '@/lib/prompts/reading-runtime';
import { transitAlert } from '@/lib/prompts/reading-templates';
import {
  detectSignificantTransits,
  type DetectedTransit,
} from '@/lib/prompts/transit-detector';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PotencyTier = 'intense' | 'strong' | 'moderate' | 'mild';

type AlertRow = {
  planet: string;
  aspect: string;
  target: string;
  exactDate: string;
  orbEnterDate: string;
  orbExitDate: string;
  orb: number;
  scopeKey: string;
  generated: boolean;
  /** 0–100 score of how hard this transit hits this chart. */
  potency: number;
  /** Human label derived from `potency`. */
  potencyTier: PotencyTier;
  /** True if this is an eclipse landing on a natal point. */
  isEclipse: boolean;
};

// Potency weights — calibrated for the post-filter dataset (outer planets
// only, hard aspects only).
//
// Aspect: conjunction is the most intense because the transiting energy
// merges with the natal point. Opposition and square are still hard
// aspects but slightly less total-eclipse-of-the-self.
const ASPECT_WEIGHT: Record<string, number> = {
  conjunction: 1.00,
  opposition:  0.92,
  square:      0.85,
  // soft aspects retained for completeness if filter loosens later
  trine:       0.55,
  sextile:     0.40,
};

// Transiting planet: slower planet = longer activation window = bigger
// impact on biography. Pluto > Neptune > Uranus > Saturn > Jupiter.
const PLANET_WEIGHT: Record<string, number> = {
  Pluto:   1.00,
  Neptune: 0.92,
  Uranus:  0.85,
  Saturn:  0.78,
  Jupiter: 0.62,
};

// Natal target: angles + luminaries are the most personal points; the
// other personal planets are still felt but less totally.
const TARGET_WEIGHT: Record<string, number> = {
  Sun:     1.00,
  Moon:    1.00,
  ASC:     1.00,
  MC:      0.96,
  Mars:    0.82,
  Venus:   0.78,
  Mercury: 0.74,
};

// Tight orb = stronger transit. We use the MINIMUM orb observed during the
// transit window (i.e., how close to exact it gets). 0° exact -> 1.0, larger
// orb -> falls off. We clamp at ORB_CEILING degrees since the detector orbs
// are already ≤1.5°.
const ORB_CEILING = 1.5;
function orbTightness(orb: number): number {
  const clamped = Math.max(0, Math.min(orb, ORB_CEILING));
  return 1 - (clamped / ORB_CEILING) * 0.65; // ranges 0.35 .. 1.00
}

function scorePotency(t: DetectedTransit): { potency: number; tier: PotencyTier; isEclipse: boolean } {
  const isEclipse = t.kind === 'eclipse';
  const aspect = ASPECT_WEIGHT[t.aspect] ?? 0.5;
  const planet = PLANET_WEIGHT[t.planet] ?? 0.6;
  const target = TARGET_WEIGHT[t.target] ?? 0.7;
  const tight = orbTightness(t.orb);
  let raw = aspect * planet * target * tight * 100;
  if (isEclipse) raw = Math.min(100, raw + 18); // eclipses kick up a tier
  const potency = Math.round(raw);
  const tier: PotencyTier =
    potency >= 75 ? 'intense' :
    potency >= 55 ? 'strong' :
    potency >= 35 ? 'moderate' : 'mild';
  return { potency, tier, isEclipse };
}

function transitScopeKey(t: DetectedTransit): string {
  return `${t.planet}|${t.aspect}|${t.target}|${t.exactDate}`;
}

function parseScopeKey(
  key: string,
): { planet: string; aspect: string; target: string; exactDate: string } | null {
  const parts = key.split('|');
  if (parts.length < 4) return null;
  return { planet: parts[0], aspect: parts[1], target: parts[2], exactDate: parts[3] };
}

export async function GET(req: Request) {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'depth')) {
    return upgradeResponse('depth', 'Transit alerts are a Depth-tier feature');
  }

  const url = new URL(req.url);
  const generateKey = url.searchParams.get('generate');

  const astroInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  if (!astroInput) {
    return NextResponse.json({ error: 'birth-data-missing' }, { status: 400 });
  }
  const chart: Chart = computeTropicalChart(astroInput);

  // Stream a single alert on demand
  if (generateKey) {
    const parsed = parseScopeKey(generateKey);
    if (!parsed) {
      return NextResponse.json({ error: 'invalid-scope-key' }, { status: 400 });
    }

    const cached = await getCachedReading(supabase, profile.user_id, 'transit-alerts', generateKey);
    if (cached && cached.trim()) return replayCachedAsStream(cached);

    const prompt = transitAlert({
      chart,
      firstName: profile.first_name || '',
      transit: {
        planet: parsed.planet,
        aspect: parsed.aspect,
        target: parsed.target,
        exactDate: parsed.exactDate,
      },
    });

    return streamReading({
      prompt,
      onComplete: async (full) => {
        await saveCachedReading(supabase, profile.user_id, 'transit-alerts', generateKey, full);
      },
    });
  }

  // List mode — detect significant transits within the requested scope.
  // scope=week (7d) | month (30d, default) | year (365d) | decade (~3650d).
  // Longer windows only really make sense for the slow outer planets, so we
  // already filter to those via detectOuterTransits in the detector.
  const scopeParam = (url.searchParams.get('scope') || 'month').toLowerCase();
  const days = scopeParam === 'week'
    ? 7
    : scopeParam === 'year'
      ? 365
      : scopeParam === 'decade'
        ? 3650
        : 30;
  const maxResults = scopeParam === 'decade'
    ? 30
    : scopeParam === 'year'
      ? 20
      : 12;
  const start = new Date();
  const end = new Date(start.getTime() + days * 86400 * 1000);

  // Medium-to-hard impact only — Ethan's rule (2026-05-20). The detector
  // already restricts to outer planets hitting personal points, but it
  // still returns trines and sextiles which feel like noise to a user.
  // Drop them. Keep hard aspects (conjunction/opposition/square) plus
  // eclipses (always significant when on a natal point).
  //
  // NOTE: maxResults slice happens AFTER potency-ranking below so a high
  // potency hit late in the window can't be evicted by a low-potency hit
  // early in the window.
  const HARD_ASPECTS = new Set(['conjunction', 'opposition', 'square']);
  const detected = detectSignificantTransits(chart, { start, end }, {
    includeEclipses: true,
    includeInnerStations: false,
  })
    .filter((t) => t.kind === 'eclipse' || HARD_ASPECTS.has(t.aspect));

  // Pull existing rows for these scope keys. We cast to `any` because the
  // generated Database type doesn't yet know about astral.readings.
  const looseSupabase = supabase as unknown as {
    schema: (s: string) => { from: (t: string) => any };
  };

  const scopeKeys = detected.map(transitScopeKey);
  let cachedKeys = new Set<string>();
  if (scopeKeys.length > 0) {
    const q = looseSupabase
      .schema('astral')
      .from('readings')
      .select('scope_key, body')
      .eq('user_id', profile.user_id)
      .eq('reading_type', 'transit-alerts')
      .in('scope_key', scopeKeys);
    const { data } = (await q) as { data: { scope_key: string; body: string | null }[] | null };
    const rows = data ?? [];
    cachedKeys = new Set(rows.filter((r) => (r.body ?? '').trim().length > 0).map((r) => r.scope_key));
  }

  // Pull dismissed rows (scope_key suffix '#dismissed')
  const dismissedKeys = new Set<string>();
  {
    const q = looseSupabase
      .schema('astral')
      .from('readings')
      .select('scope_key')
      .eq('user_id', profile.user_id)
      .eq('reading_type', 'transit-alerts-dismissed');
    const { data } = (await q) as { data: { scope_key: string }[] | null };
    const rows = data ?? [];
    rows.forEach((r) => dismissedKeys.add(r.scope_key));
  }

  const alerts: AlertRow[] = detected
    .filter((t) => !dismissedKeys.has(transitScopeKey(t)))
    .map((t) => {
      const { potency, tier, isEclipse } = scorePotency(t);
      return {
        planet: t.planet,
        aspect: t.aspect,
        target: t.target,
        exactDate: t.exactDate,
        orbEnterDate: t.orbEnterDate,
        orbExitDate: t.orbExitDate,
        orb: t.orb,
        scopeKey: transitScopeKey(t),
        generated: cachedKeys.has(transitScopeKey(t)),
        potency,
        potencyTier: tier,
        isEclipse,
      };
    })
    // Rank by potency descending so the heaviest hits sit at the top of
    // the panel. Within the same potency, earlier exactDate wins.
    .sort((a, b) =>
      b.potency !== a.potency
        ? b.potency - a.potency
        : a.exactDate.localeCompare(b.exactDate),
    )
    .slice(0, maxResults);

  return NextResponse.json({ alerts });
}

type DismissBody = { alertId?: string; action?: 'dismiss' };

export async function POST(req: Request) {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'depth')) {
    return upgradeResponse('depth', 'Transit alerts are a Depth-tier feature');
  }

  let body: DismissBody;
  try {
    body = (await req.json()) as DismissBody;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  if (!body.alertId || body.action !== 'dismiss') {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }

  try {
    const looseSupabase = supabase as unknown as {
      schema: (s: string) => { from: (t: string) => any };
    };
    await looseSupabase
      .schema('astral')
      .from('readings')
      .upsert(
        {
          user_id: profile.user_id,
          reading_type: 'transit-alerts-dismissed',
          scope_key: body.alertId,
          body: '',
        },
        { onConflict: 'user_id,reading_type,scope_key' },
      );
  } catch (e) {
    console.error('[transit-alerts] dismiss failed', e);
    return NextResponse.json({ error: 'dismiss-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
