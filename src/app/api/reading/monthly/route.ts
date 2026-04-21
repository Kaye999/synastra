// /api/reading/monthly — GET. Streams the monthly forecast. Cached by
// (user_id, 'monthly', 'YYYY-MM').
//
// Tier gate: reader or depth.

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
import { monthlyForecast } from '@/lib/prompts/reading-templates';
import { detectSignificantTransits, type DetectedTransit } from '@/lib/prompts/transit-detector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentMonth(): { key: string; name: string; start: Date; end: Date } {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-based
  const key = `${y}-${String(m + 1).padStart(2, '0')}`;
  const name = `${MONTH_NAMES[m]} ${y}`;
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
  return { key, name, start, end };
}

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'reader')) {
    return upgradeResponse('reader', 'Upgrade to Reader to unlock monthly forecasts');
  }

  const month = currentMonth();
  const cached = await getCachedReading(supabase, profile.user_id, 'monthly', month.key);
  if (cached) return replayCachedAsStream(cached);

  const astroInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  let chart: Chart | null = null;
  let transits: DetectedTransit[] = [];
  if (astroInput) {
    chart = computeTropicalChart(astroInput);
    transits = detectSignificantTransits(chart, { start: month.start, end: month.end }, {
      includeEclipses: true,
    }).slice(0, 18);
  }

  const prompt = monthlyForecast({
    chart,
    firstName: profile.first_name || '',
    monthIso: month.key,
    monthName: month.name,
    transits,
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'monthly', month.key, full);
    },
  });
}
