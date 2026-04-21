// /api/reading/compatibility — POST { otherBirthData, otherName?, userContext? }.
// Streams a synastry + composite reading against the signed-in user's chart.
// Cached by (user_id, 'compatibility', sha256(otherBirthData)).
//
// Tier gate: depth only. Free + reader -> 402 with upgrade CTA.
// Reader-tier users that somehow reach here would also be rejected (defensive).

import { createHash } from 'node:crypto';
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
import { compatibility } from '@/lib/prompts/reading-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PostBody = {
  otherBirthData?: BirthData;
  otherName?: string;
  userContext?: string;
};

function hashBirth(b: unknown): string {
  try {
    return createHash('sha256').update(JSON.stringify(b)).digest('hex').slice(0, 32);
  } catch {
    return 'unknown';
  }
}

export async function POST(req: Request) {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'depth')) {
    return upgradeResponse('depth', 'Compatibility readings require the Depth tier');
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid-json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.otherBirthData || !body.otherBirthData.dob) {
    return new Response(JSON.stringify({ error: 'missing-otherBirthData' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const scopeKey = hashBirth(body.otherBirthData);
  const cached = await getCachedReading(supabase, profile.user_id, 'compatibility', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  const aInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  const bInput = birthDataToAstroInput(body.otherBirthData);

  let chartA: Chart | null = null;
  let chartB: Chart | null = null;
  if (aInput) chartA = computeTropicalChart(aInput);
  if (bInput) chartB = computeTropicalChart(bInput);

  const prompt = compatibility({
    chartA,
    chartB,
    firstNameA: profile.first_name || 'Subject',
    firstNameB: body.otherName || body.otherBirthData.name || 'Partner',
    userContext: body.userContext,
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'compatibility', scopeKey, full);
    },
  });
}
