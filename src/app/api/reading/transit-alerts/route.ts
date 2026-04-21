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
};

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

  // List mode — detect next 30 days of significant transits, cross-reference
  // with cache to know which are already generated.
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 86400 * 1000);
  const detected = detectSignificantTransits(chart, { start, end }, {
    includeEclipses: true,
    includeInnerStations: false,
  }).slice(0, 12);

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
    .map((t) => ({
      planet: t.planet,
      aspect: t.aspect,
      target: t.target,
      exactDate: t.exactDate,
      orbEnterDate: t.orbEnterDate,
      orbExitDate: t.orbExitDate,
      orb: t.orb,
      scopeKey: transitScopeKey(t),
      generated: cachedKeys.has(transitScopeKey(t)),
    }));

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
