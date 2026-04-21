// /api/reading/gene-keys — GET. Streams the Gene Keys Activation Sequence
// reading (Life's Work / Evolution / Radiance / Purpose woven into one
// essay). Generated ONCE per user — the Hologenetic Profile is natal and
// doesn't drift, so we cache forever under scope_key='default'.
//
// Tier gate: depth only. Reader/Free -> 402.
//
// The prompt threads the user's four Activation Sequence keys and, when
// available, a Human Design type hint (same 64-gate wheel already drives
// both systems, so HD type is trivially derivable from the chart in a
// future pass — for now we pass null).

import type { BirthData } from '@/lib/types';
import { computeHologeneticProfileFromAstroInput } from '@/lib/engines/gene-keys';
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
import { geneKeysReading } from '@/lib/prompts/reading-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'depth')) {
    return upgradeResponse('depth', 'Upgrade to Depth to unlock the Gene Keys Hologenetic Profile reading');
  }

  const scopeKey = 'default';
  const cached = await getCachedReading(supabase, profile.user_id, 'gene-keys', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  const birth = profile.birth_data as BirthData | null | undefined;
  const astroInput = birthDataToAstroInput(birth);
  if (!astroInput) {
    return new Response(
      JSON.stringify({ error: 'birth-data-required', message: 'Birth chart required for Gene Keys reading' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const profileGK = computeHologeneticProfileFromAstroInput(astroInput);

  const prompt = geneKeysReading({
    chart: null,
    firstName: profile.first_name || birth?.name || '',
    lifesWork: profileGK.activation.lifesWork,
    evolution: profileGK.activation.evolution,
    radiance: profileGK.activation.radiance,
    purpose: profileGK.activation.purpose,
    humanDesignType: null, // TODO: surface HD type once engine exposes it
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'gene-keys', scopeKey, full);
    },
  });
}
