// /api/reading/shadow — GET. Streams a shadow-work reading. Rotates weekly.
// Cached by (user_id, 'shadow', isoWeek).
//
// Tier gate: reader or depth.

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
import { shadowWork } from '@/lib/prompts/reading-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ISO-8601 week string ("2026-W17"). Computed off UTC for reproducibility.
function isoWeek(): string {
  const d = new Date();
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday in current week decides the year
  const dayNum = (utc.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  utc.setUTCDate(utc.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(utc.getUTCFullYear(), 0, 4));
  const firstThuDayNum = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - firstThuDayNum + 3);
  const week = 1 + Math.round((utc.getTime() - firstThu.getTime()) / (7 * 86400 * 1000));
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'reader')) {
    return upgradeResponse('reader', 'Upgrade to Reader to unlock shadow-work readings');
  }

  const scopeKey = isoWeek();
  const cached = await getCachedReading(supabase, profile.user_id, 'shadow', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  const astroInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  let chart: Chart | null = null;
  if (astroInput) chart = computeTropicalChart(astroInput);

  const prompt = shadowWork({
    chart,
    firstName: profile.first_name || '',
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'shadow', scopeKey, full);
    },
  });
}
