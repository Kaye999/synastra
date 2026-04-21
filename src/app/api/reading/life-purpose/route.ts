// /api/reading/life-purpose — GET. Streams the life-purpose synthesis.
// Generated ONCE per user; cached forever under scope_key='default'.
//
// Tier gate: reader or depth.

import type { BirthData, Chart } from '@/lib/types';
import { computeTropicalChart } from '@/lib/engines/astro';
import { computeNumerology } from '@/lib/engines/numerology';
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
import { lifePurpose } from '@/lib/prompts/reading-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'reader')) {
    return upgradeResponse('reader', 'Upgrade to Reader to unlock your life-purpose reading');
  }

  const scopeKey = 'default';
  const cached = await getCachedReading(supabase, profile.user_id, 'life-purpose', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  const birth = profile.birth_data as BirthData | null | undefined;
  const astroInput = birthDataToAstroInput(birth);
  let chart: Chart | null = null;
  if (astroInput) chart = computeTropicalChart(astroInput);

  // Numerology for destiny + life-path. Numerology engine takes fullName +
  // dob. Fall back gracefully if fullName missing.
  let lifePath: number | string | undefined;
  let destinyNumber: number | string | undefined;
  if (birth?.fullName && birth?.dob) {
    try {
      const n = computeNumerology(
        birth.fullName,
        birth.dob,
        new Date().getUTCFullYear(),
        profile.first_name || birth.name || birth.fullName,
      );
      lifePath = n.lifePath;
      destinyNumber = n.expression;
    } catch (e) {
      console.error('[life-purpose] numerology failed', e);
    }
  }

  const prompt = lifePurpose({
    chart,
    firstName: profile.first_name || birth?.name || '',
    lifePath,
    destinyNumber,
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'life-purpose', scopeKey, full);
    },
  });
}
