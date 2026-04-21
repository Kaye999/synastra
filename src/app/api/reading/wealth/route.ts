// /api/reading/wealth — GET. Streams a quarterly wealth-timing reading.
// Cached by (user_id, 'wealth', 'YYYY-Q').
//
// Tier gate: depth only.

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
import { wealthTiming } from '@/lib/prompts/reading-templates';
import { detectSignificantTransits, type DetectedTransit } from '@/lib/prompts/transit-detector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function currentQuarter(): { key: string; start: Date; end: Date } {
  const d = new Date();
  const y = d.getUTCFullYear();
  const q = Math.floor(d.getUTCMonth() / 3); // 0..3
  const startMonth = q * 3;
  const start = new Date(Date.UTC(y, startMonth, 1));
  const end = new Date(start.getTime() + 90 * 86400 * 1000);
  return { key: `${y}-Q${q + 1}`, start, end };
}

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'depth')) {
    return upgradeResponse('depth', 'Wealth timing is a Depth-tier reading');
  }

  const q = currentQuarter();
  const cached = await getCachedReading(supabase, profile.user_id, 'wealth', q.key);
  if (cached) return replayCachedAsStream(cached);

  const astroInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  let chart: Chart | null = null;
  let transits: DetectedTransit[] = [];
  if (astroInput) {
    chart = computeTropicalChart(astroInput);
    // Get 90-day window starting today (not start of quarter — electional is forward-looking)
    const start = new Date();
    const end = new Date(start.getTime() + 90 * 86400 * 1000);
    transits = detectSignificantTransits(chart, { start, end }, { includeEclipses: true })
      // Filter to Jupiter/Saturn and whatever hits natal 2H/6H/10H (we don't
      // know houses at this layer — the prompt will handle the house logic).
      .filter((t) => t.planet === 'Jupiter' || t.planet === 'Saturn' || t.kind === 'eclipse')
      .slice(0, 20);
  }

  const rangeStartIso = new Date().toISOString().slice(0, 10);
  const rangeEndIso = new Date(Date.now() + 90 * 86400 * 1000).toISOString().slice(0, 10);

  const prompt = wealthTiming({
    chart,
    firstName: profile.first_name || '',
    rangeStartIso,
    rangeEndIso,
    transits,
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'wealth', q.key, full);
    },
  });
}
