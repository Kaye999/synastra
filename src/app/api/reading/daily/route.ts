// /api/reading/daily — GET. Streams today's daily guidance for the signed-in
// user. Cached by (user_id, 'daily', YYYY-MM-DD).
//
// Tier gate: reader or depth. Free -> 402.

import type { Chart, BirthData } from '@/lib/types';
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
import { dailyGuidance } from '@/lib/prompts/reading-templates';
import { detectSignificantTransits, type DetectedTransit } from '@/lib/prompts/transit-detector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function todayScopeKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'reader')) {
    return upgradeResponse('reader', 'Upgrade to Reader to unlock daily guidance');
  }

  const scopeKey = todayScopeKey();
  const cached = await getCachedReading(supabase, profile.user_id, 'daily', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  // Build chart + detect a compact set of today's significant transits.
  const astroInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  let chart: Chart | null = null;
  let transits: DetectedTransit[] = [];
  if (astroInput) {
    chart = computeTropicalChart(astroInput);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 86400 * 1000);
    transits = detectSignificantTransits(chart, { start, end }).slice(0, 6);
  }

  const prompt = dailyGuidance({
    chart,
    firstName: profile.first_name || '',
    todayIso: scopeKey,
    transits,
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'daily', scopeKey, full);
    },
  });
}
