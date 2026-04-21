// /api/reading/tarot — tarot readings across three spread types.
//
//   GET ?type=daily
//     → streams Claude's interpretation of today's daily card for the
//       signed-in user. Reader+ tier. Cached by (user_id, 'tarot-daily', 'YYYY-MM-DD').
//
//   POST { type: 'three-card' | 'celtic-cross', question, userContext? }
//     → streams the interpretation of a newly-dealt spread. Reader+ for
//       three-card. Depth-only for Celtic Cross. Cached by
//       (user_id, 'tarot-three'/'tarot-celtic', sha256(question)).
//
// The draw itself is deterministic (see /lib/engines/tarot.ts) so the client
// can render the exact cards this endpoint reasoned over — no drift between
// the visible spread and the body of the reading.

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
import {
  tarotDaily,
  tarotThreeCard,
  tarotCelticCross,
  type TarotCardBrief,
  type TarotSpreadPositionBrief,
} from '@/lib/prompts/reading-templates';
import {
  dailyCard,
  drawThreeCard,
  drawCelticCross,
  type TarotDraw,
  type ThreeCardSpread,
  type CelticCrossSpread,
} from '@/lib/engines/tarot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============================================================
 * Shared helpers
 * ============================================================ */

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function hashQuestion(q: string): string {
  return createHash('sha256').update(q.trim()).digest('hex').slice(0, 24);
}

function buildChart(birth: unknown): Chart | null {
  const input = birthDataToAstroInput(birth as BirthData | null | undefined);
  if (!input) return null;
  return computeTropicalChart(input);
}

function drawToBrief(d: TarotDraw): TarotCardBrief {
  return {
    name: d.card.name,
    arcana: d.card.arcana,
    suit: d.card.suit,
    number: d.card.number,
    element: d.card.element,
    zodiacal: d.card.zodiacal,
    reversed: d.reversed,
    keywords: d.reversed ? d.card.keywords.reversed : d.card.keywords.upright,
    body: d.card.body,
    shadow: d.card.shadow,
    gift: d.card.gift,
  };
}

function spreadToBriefs(
  spread: ThreeCardSpread | CelticCrossSpread,
): TarotSpreadPositionBrief[] {
  return spread.map((s) => ({
    position: String(s.position),
    label: s.label,
    card: drawToBrief({ card: s.card, reversed: s.reversed }),
  }));
}

function badRequest(msg: string): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/* ============================================================
 * GET — daily card
 * ============================================================ */

export async function GET(req: Request) {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? 'daily';

  if (type !== 'daily') {
    return badRequest('unsupported-type-for-get');
  }

  if (!hasTier(profile.tier, 'reader')) {
    return upgradeResponse('reader', 'Upgrade to Reader to unlock your daily tarot card');
  }

  const scopeKey = todayKey();
  const cached = await getCachedReading(supabase, profile.user_id, 'tarot-daily', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  const today = new Date();
  const drawn = dailyCard(profile.user_id, today);
  const chart = buildChart(profile.birth_data);

  const prompt = tarotDaily({
    chart,
    firstName: profile.first_name || '',
    todayIso: scopeKey,
    card: drawToBrief(drawn),
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'tarot-daily', scopeKey, full);
    },
  });
}

/* ============================================================
 * POST — three-card / Celtic Cross
 * ============================================================ */

type PostBody = {
  type?: 'three-card' | 'celtic-cross';
  question?: string;
  userContext?: string;
};

export async function POST(req: Request) {
  const authed = await authenticated();
  if (!authed.ok) return authed.response;

  const loaded = await loadProfile(authed.userId);
  if (!loaded.ok) return loaded.response;
  const { profile, supabase } = loaded;

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return badRequest('invalid-json');
  }

  const type = body.type;
  if (type !== 'three-card' && type !== 'celtic-cross') {
    return badRequest('unknown-spread-type');
  }

  // Normalise the question — max 200 chars per spec.
  const question = (body.question ?? '').trim().slice(0, 200);

  if (type === 'three-card') {
    if (!hasTier(profile.tier, 'reader')) {
      return upgradeResponse('reader', 'Upgrade to Reader to cast a three-card spread');
    }

    const scopeKey = `three-${hashQuestion(question)}`;
    const cached = await getCachedReading(supabase, profile.user_id, 'tarot-three', scopeKey);
    if (cached) return replayCachedAsStream(cached);

    const spread = drawThreeCard(profile.user_id, question);
    const chart = buildChart(profile.birth_data);

    const prompt = tarotThreeCard({
      chart,
      firstName: profile.first_name || '',
      question,
      cards: spreadToBriefs(spread),
      userContext: body.userContext,
    });

    return streamReading({
      prompt,
      onComplete: async (full) => {
        await saveCachedReading(supabase, profile.user_id, 'tarot-three', scopeKey, full);
      },
    });
  }

  // celtic-cross — depth tier only
  if (!hasTier(profile.tier, 'depth')) {
    return upgradeResponse('depth', 'The Celtic Cross is a Depth-tier reading');
  }

  const scopeKey = `celtic-${hashQuestion(question)}`;
  const cached = await getCachedReading(supabase, profile.user_id, 'tarot-celtic', scopeKey);
  if (cached) return replayCachedAsStream(cached);

  const spread = drawCelticCross(profile.user_id, question);
  const chart = buildChart(profile.birth_data);

  const prompt = tarotCelticCross({
    chart,
    firstName: profile.first_name || '',
    question,
    cards: spreadToBriefs(spread),
    userContext: body.userContext,
  });

  return streamReading({
    prompt,
    onComplete: async (full) => {
      await saveCachedReading(supabase, profile.user_id, 'tarot-celtic', scopeKey, full);
    },
  });
}
