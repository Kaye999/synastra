// /api/reading/ayurveda — GET. Streams a Claude reading that weaves the
// reader's prakruti (dosha constitution) with their natal chart.
//
// Tier gate: reader or depth. Cached once per prakruti per chart; regenerate
// only when the reader re-takes the quiz (the cache key includes the dominant
// + secondary dosha).
//
// The prompt follows the spec: the fire in Pitta meets their Sun sign; the
// air in Vata meets their Mercury; find the body-cosmos correspondence.

import type { BirthData, Chart, Planet } from '@/lib/types';
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
import { BASE_VOICE, type ReadingPromptResult } from '@/lib/prompts/reading-templates';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Dosha, Prakruti } from '@/lib/engines/ayurveda';
import { constitutionLabel } from '@/lib/engines/ayurveda';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AyurvedaPayload = Prakruti & {
  answers?: Record<string, Dosha>;
  completed_at?: string;
  version?: number;
};

async function loadAyurveda(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<AyurvedaPayload | null> {
  type Loose = { schema: (s: string) => { from: (t: string) => unknown } };
  const q = (
    (supabase as unknown as Loose)
      .schema('astral')
      .from('profiles') as {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          maybeSingle: () => Promise<{ data: { ayurveda: AyurvedaPayload | null } | null }>;
        };
      };
    }
  )
    .select('ayurveda')
    .eq('user_id', userId)
    .maybeSingle();
  const { data } = await q;
  return data?.ayurveda ?? null;
}

function findPlanetSign(chart: Chart | null, planetName: string): string | null {
  if (!chart) return null;
  const p: Planet | undefined = chart.planets.find((x) => x.planet === planetName);
  return p?.sign ?? null;
}

function buildPrompt(
  prakruti: AyurvedaPayload,
  chart: Chart | null,
  firstName: string,
): ReadingPromptResult {
  const label = constitutionLabel(prakruti);
  const dominant = prakruti.dominant;
  const secondary = prakruti.secondary;
  const pct = prakruti.percentages;

  const sun = findPlanetSign(chart, 'Sun') ?? 'an unknown Sun sign';
  const moon = findPlanetSign(chart, 'Moon') ?? 'an unknown Moon';
  const mercury = findPlanetSign(chart, 'Mercury') ?? 'an unknown Mercury';
  const mars = findPlanetSign(chart, 'Mars') ?? 'an unknown Mars';

  const name = firstName || 'the reader';

  const system = `${BASE_VOICE}

TASK: Write a body-cosmos correspondence essay for ${name} — roughly 550 words — weaving their dosha constitution with their astrological chart. The essay reads as an editorial piece at the seam between Ayurveda and Western astrology. The voice is observational and precise: a botanist describing a river system rather than a yoga teacher selling a retreat.

Structure:
1. A framing paragraph (4-5 sentences) that opens on ${name}'s constitution (${label}) and names the elemental signature of the dominant dosha. State percentages once. Do not use the word "holistic".
2. Three short labelled sections, each 3-4 sentences, each tying one dosha's element to a specific natal placement:
The fire
The air
The earth
  - "The fire" maps Pitta's fire + water to ${name}'s Sun and Mars placements by sign.
  - "The air" maps Vata's air + ether to ${name}'s Mercury and (where relevant) the rulers of the mind.
  - "The earth" maps Kapha's earth + water to ${name}'s Moon and the body placements.
3. A closing paragraph (3-4 sentences) on what this pairing — Ayurvedic constitution against natal chart — specifically asks this reader to regulate. One concrete practice. No platitudes.

One pull-quote-worthy line lives somewhere in the piece.

Constraints:
- Use the exact section headings shown above, each on its own line, followed by a blank line, then prose.
- Reference the actual placements by sign (e.g. "Sun in Scorpio", "Mercury in Gemini"). Do not reference houses unless given explicit house data.
- Never suggest the reader's dosha percentages are wrong. Treat them as diagnostic.`;

  const userMessage = `Subject: ${name}

Prakruti:
- Dominant: ${dominant} (${pct[dominant]}%)
- Secondary: ${secondary ? `${secondary} (${pct[secondary]}%)` : 'none'}
- Third: ${
    (Object.keys(pct) as Dosha[]).find((d) => d !== dominant && d !== secondary) ??
    'none'
  } (${
    pct[
      (Object.keys(pct) as Dosha[]).find((d) => d !== dominant && d !== secondary) ||
        dominant
    ]
  }%)
- Type: ${prakruti.type}
- Label: ${label}

Natal placements:
- Sun: ${sun}
- Moon: ${moon}
- Mercury: ${mercury}
- Mars: ${mars}

Write the Ayurveda × chart reading now. Roughly 550 words. The fire in Pitta meets their Sun. The air in Vata meets their Mercury. The earth in Kapha meets their Moon. Find the body-cosmos correspondence.`;

  return { system, userMessage, maxTokens: 1300 };
}

function scopeKey(prakruti: AyurvedaPayload): string {
  const d = prakruti.dominant;
  const s = prakruti.secondary ?? 'none';
  return `${d}-${s}-${prakruti.type}`;
}

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'reader')) {
    return upgradeResponse('reader', 'Upgrade to Reader to unlock the Ayurveda × chart reading');
  }

  const prakruti = await loadAyurveda(supabase, profile.user_id);
  if (!prakruti) {
    return new Response(
      JSON.stringify({ error: 'prakruti-not-found', message: 'Take the prakruti quiz first.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const key = scopeKey(prakruti);
  const cached = await getCachedReading(supabase, profile.user_id, 'ayurveda', key);
  if (cached) return replayCachedAsStream(cached);

  const astroInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  let chart: Chart | null = null;
  if (astroInput) chart = computeTropicalChart(astroInput);

  const prompt = buildPrompt(prakruti, chart, profile.first_name || '');

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'ayurveda', key, full);
    },
  });
}
