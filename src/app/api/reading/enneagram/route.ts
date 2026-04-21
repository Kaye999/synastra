// /api/reading/enneagram — GET. Streams a synthesis reading weaving the
// reader's Enneagram result against their natal chart.
//
// Tier gate: reader or depth. Cached by (user_id, 'enneagram',
// `${primary}w${wing}-L${level}`) so re-reads are cheap and a re-taken quiz
// regenerates naturally when the key changes.

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
import { BASE_VOICE, type ReadingPromptResult } from '@/lib/prompts/reading-templates';
import {
  ENNEAGRAM_TYPES,
  formatWingLabel,
  levelBand,
} from '@/lib/interp/enneagram-types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { EnneagramResult } from '@/lib/engines/enneagram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EnneagramPayload = {
  result?: EnneagramResult;
  answers?: Record<string, 1 | 2 | 3 | 4 | 5>;
  taken_at?: string;
  version?: number;
};

type EnneagramPromptInput = {
  firstName: string;
  result: EnneagramResult;
  chart: Chart | null;
};

function enneagramChartSynthesis(input: EnneagramPromptInput): ReadingPromptResult {
  const { firstName, result, chart } = input;
  const primary = ENNEAGRAM_TYPES[result.primary];
  const wingLabel = formatWingLabel(result.primary, result.wing);
  const band = levelBand(result.level);
  const integrationProfile = ENNEAGRAM_TYPES[result.integration];
  const disintegrationProfile = ENNEAGRAM_TYPES[result.disintegration];

  const system = `${BASE_VOICE}

TASK: Weave ${firstName || 'the reader'}'s Enneagram ${wingLabel} (${primary.name}) together with their natal astrology — roughly 600 words.

You are a synthesist, not a classifier. Hold both systems at once. Where they reinforce each other, name the reinforcement. Where they contradict, name the contradiction — and do not flatten the tension. Reference specific natal placements (Sun sign + house, Moon, Ascendant, Saturn, Mars, Venus, nodes, Chiron) and specific Enneagram mechanics (the core fear/desire, the wing's colour, the integration arrow to ${integrationProfile.name}, the disintegration arrow to ${disintegrationProfile.name}, the ${primary.center} centre).

Structure — no bullet points. Each section is one to three paragraphs. Use these exact section headings on their own line, followed by a blank line, then prose:

Where the systems agree
Where they contradict
Their integration path
Their stress signature
The useful reading

"The useful reading" is the closing — a single, declarative synthesis of what this person is working on across both systems, and what it asks of them. One pull-quote-worthy line lives somewhere in the piece.`;

  const userMessage = `Reader: ${firstName || 'the reader'}

Enneagram result:
- Primary type: ${result.primary} (${primary.name})
- Wing: ${result.wing ?? 'none'} → ${wingLabel}
- Centre: ${primary.center}
- Tritype: ${result.tritype.join('-')}
- Level of health: ${result.level} (${band})
- Integration (growth) arrow: ${result.primary} → ${result.integration} (${integrationProfile.name})
- Disintegration (stress) arrow: ${result.primary} → ${result.disintegration} (${disintegrationProfile.name})
- Core fear: ${primary.core.fear}
- Core desire: ${primary.core.desire}
- Core motivation: ${primary.core.motivation}

Natal chart (for placement cross-reference):
${JSON.stringify(chart ?? {}, null, 2)}

Write the synthesis reading now. ~600 words, no markdown fences.`;

  return { system, userMessage, maxTokens: 1300 };
}

export async function GET() {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  if (!hasTier(profile.tier, 'reader')) {
    return upgradeResponse('reader', 'Upgrade to Reader to unlock the Enneagram synthesis');
  }

  // Pull the stored Enneagram payload. The generated Database type doesn't
  // yet know about the column, so we go through a second loose client to
  // fetch just that field.
  const loose = (await createSupabaseServerClient()) as unknown as {
    schema: (s: string) => { from: (t: string) => any };
  };
  const { data: ennRow } = (await loose
    .schema('astral')
    .from('profiles')
    .select('enneagram')
    .eq('user_id', authed.userId)
    .maybeSingle()) as { data: { enneagram: EnneagramPayload | null } | null };

  const enneagram = ennRow?.enneagram;
  if (!enneagram || !enneagram.result) {
    return Response.json(
      {
        error: 'enneagram-missing',
        message: 'Take the Enneagram assessment before requesting the reading.',
      },
      { status: 409 },
    );
  }

  const result = enneagram.result;
  const scopeKey = `${result.primary}w${result.wing ?? 'x'}-L${result.level}`;

  const cached = await getCachedReading(supabase, profile.user_id, 'enneagram', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  const astroInput = birthDataToAstroInput(profile.birth_data as BirthData | null | undefined);
  let chart: Chart | null = null;
  if (astroInput) chart = computeTropicalChart(astroInput);

  const prompt = enneagramChartSynthesis({
    firstName: profile.first_name || '',
    result,
    chart,
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'enneagram', scopeKey, full);
    },
  });
}
