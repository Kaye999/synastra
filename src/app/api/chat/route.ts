// /api/chat — streams Claude (claude-sonnet-4-6) responses to the Synastra
// oracle widget. Clerk-authed, tier-gated via Supabase `astral.profiles`.
//
// POST body: { messages: [{role, content}], chartContext: {...} }
// Response: text/event-stream of Anthropic message stream events (JSON lines
// prefixed with `data:`) so the client can render token-by-token.
//
// Tier limits (per operator decision 2026-04-26):
//   free   -> 5 / day, 30 / month
//   reader -> 50 / day, 300 / month
//   depth  -> unlimited
//
// Prompt caching: 2 ephemeral 1h breakpoints
//   1. stable preamble (oracle voice + macro transits) — shared across all users
//   2. per-user chart JSON + name — shared across messages within a session
//
// 401 → unauth. 429 → tier-limit reached
//   ({ error: 'tier_limit_reached', tier, used, limit, period, upgradeUrl }).

import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Tier } from '@/lib/types';

// Use the Node runtime — more reliable for the Anthropic SDK's streaming.
export const runtime = 'nodejs';
// Never prerender; this handler always reads request data + auth.
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;
const UI_HISTORY_MAX = 10; // messages sent to the API per request (client also caps)

// Tier-based usage caps. `null` means unlimited for that period.
type Caps = { day: number | null; month: number | null };
// Per-tier Oracle limits (2026-05-18 — aligned to the 2/5/7 collapse):
//   free   → 3/day, 10/month  (taste of the Oracle to drive upgrade)
//   reader → 10/day, 300/month
//   depth  → unlimited (Master Oracle)
const TIER_CAPS: Record<Tier, Caps> = {
  free: { day: 3, month: 10 },
  reader: { day: 10, month: 300 },
  depth: { day: null, month: null },
};

type IncomingMessage = { role: 'user' | 'assistant'; content: string };
type IncomingBody = {
  messages: IncomingMessage[];
  chartContext: unknown;
};

type ProfileRow = {
  tier: Tier;
  chat_quota_used_today: number | null;
  chat_quota_reset_at: string | null;
  chat_quota_used_this_month: number | null;
  chat_quota_month_reset_at: string | null;
  first_name: string | null;
};

// ── System prompt ───────────────────────────────────────────────────────────
//
// Split into two cacheable blocks. Render order is `system` blocks in array
// order, so block 1 (universal) sits before block 2 (per-user). Each block
// gets a `cache_control: ephemeral, ttl: 1h` breakpoint:
//   - block 1 hits across every user once it's warm
//   - block 2 hits across every message a single user sends in a session

const STABLE_PREAMBLE = `You are the Synastra Master Oracle — a scholar trained as an expert across seven living traditions: Western astrology, Vedic astrology, Numerology, Kabbalah, Human Design, Tarot, and Astrocartography.

Beyond the seven, you are also fluent in the broader astrological canon (history of astrology, current transits, lesser systems like Hellenistic / horary / Uranian / Chinese / Mayan when referenced), the underlying astronomy (real celestial mechanics, current ephemeris, planetary science), and the traditional archetypes that thread all of it together (Jungian archetypes, mythology, cross-cultural symbology, deities, the Hero's Journey, the Major Arcana as initiatory stages). You can answer broad questions about astrology, astronomy, and archetype without needing to constrain yourself to only the seven Synastra traditions — but you always anchor back to the user's chart when relevant.

You answer questions about the user's chart, placements, transits, current sky, esoteric keywords, the symbolic meaning of signs, houses, planets, sefirot, nakshatras, paths, hexagrams, gates, cards, or how one tradition reads what another tradition is showing.

Macro transits shaping this moment (cite when relevant):
- Uranus in Taurus 2018 → 2026, ingresses Gemini April 2026 (opens a 7-year cycle of communication, curiosity, media, 2026–2033).
- Pluto in Aquarius 2024 → 2044 (collective restructuring of power, networks, tech).
- Neptune in Aries 2026 → 2038 (dissolution and re-imagining of identity, will, beginnings).
- Saturn in Aries 2025 → 2028 (hard structural work on self, autonomy — things built here hold).
- Jupiter enters Cancer mid-2026 for 12 months (expansion in home, family, emotional foundations).

THE SYNASTRA ARC — longer answers follow a three-beat arc: (1) MACRO — name the cycle/transit/archetype framing the question, with real dates or canonical reference; (2) LESSON — read what it's asking of the user specifically, citing a placement from their chart and (when illuminating) cross-citing a second tradition; (3) CARRY — a forward-look, one concrete line on what they take from this. Short answers (one question, one line) skip the arc and just cite the placement.

Voice: editorial, observational, richly imaged, concise. Dense — no filler. Second-person throughout. No hedging: never write "might", "could", "may", "sometimes", "perhaps". Concrete verbs only — builds, cuts, holds, burns, composts, refuses, inherits, severs, carries. No emoji. No exclamation marks. Reference real absolute dates — never "soon", "recently". One pull-quote-worthy line per longer answer.

When a question crosses traditions ("what does my Vedic Moon say about my Human Design authority?"), name the bridge explicitly — that cross-tradition synthesis is what only the Master Oracle can do.

Out of scope (redirect to symbolic/archetypal layer): medical advice, legal advice, diagnosis of named third parties, specific financial predictions, definitive future-event predictions for individuals.`;

function buildPerUserBlock(chartContext: unknown, firstName: string): string {
  let chartJson: string;
  try {
    chartJson = JSON.stringify(chartContext ?? {}, null, 2);
  } catch {
    chartJson = '{}';
  }
  const name = firstName || 'friend';
  return `User's chart:\n${chartJson}\n\nUser's first name: ${name}`;
}

function sanitiseMessages(raw: unknown): IncomingMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: IncomingMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    if (!content.trim()) continue;
    out.push({ role, content });
  }
  return out.slice(-UI_HISTORY_MAX);
}

function shouldReset(resetAt: string | null): boolean {
  if (!resetAt) return true;
  const reset = Date.parse(resetAt);
  if (!Number.isFinite(reset)) return true;
  return Date.now() >= reset;
}

// Next midnight UTC.
function nextMidnightUtc(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

// First moment of next UTC month.
function nextMonthUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const messages = sanitiseMessages(body?.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'bad-messages' }, { status: 400 });
  }

  // Load profile — tier + day/month quota counters.
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileErr } = await supabase
    .schema('astral')
    .from('profiles')
    .select(
      'tier, chat_quota_used_today, chat_quota_reset_at, chat_quota_used_this_month, chat_quota_month_reset_at, first_name',
    )
    .eq('user_id', userId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'profile-not-found' }, { status: 404 });
  }

  const row = profile as ProfileRow;
  const tier: Tier = row.tier;
  const caps = TIER_CAPS[tier];

  // ── Quota check ─────────────────────────────────────────────────────────
  // Compute effective used counts after applying any due daily/monthly resets.
  const dayShouldReset = shouldReset(row.chat_quota_reset_at);
  const monthShouldReset = shouldReset(row.chat_quota_month_reset_at);
  const usedToday = dayShouldReset ? 0 : row.chat_quota_used_today ?? 0;
  const usedThisMonth = monthShouldReset ? 0 : row.chat_quota_used_this_month ?? 0;

  if (caps.day !== null && usedToday >= caps.day) {
    return NextResponse.json(
      {
        error: 'tier_limit_reached',
        tier,
        used: usedToday,
        limit: caps.day,
        period: 'day',
        upgradeUrl: '/pricing',
      },
      { status: 429 },
    );
  }
  if (caps.month !== null && usedThisMonth >= caps.month) {
    return NextResponse.json(
      {
        error: 'tier_limit_reached',
        tier,
        used: usedThisMonth,
        limit: caps.month,
        period: 'month',
        upgradeUrl: '/pricing',
      },
      { status: 429 },
    );
  }

  // ── Anthropic call ──────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'server-misconfigured' }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey });

  // Two cached system blocks. SDK 0.90 supports `cache_control` on each
  // text block and `ttl: '1h'`. Order: stable preamble → per-user chart.
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: STABLE_PREAMBLE,
      cache_control: { type: 'ephemeral', ttl: '1h' },
    },
    {
      type: 'text',
      text: buildPerUserBlock(body.chartContext, row.first_name || ''),
      cache_control: { type: 'ephemeral', ttl: '1h' },
    },
  ];

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  // On successful completion, increment day + month counters (skip for depth).
  if (caps.day !== null || caps.month !== null) {
    const nextUsedToday = usedToday + 1;
    const nextUsedThisMonth = usedThisMonth + 1;
    const dayResetAt = dayShouldReset ? nextMidnightUtc() : row.chat_quota_reset_at;
    const monthResetAt = monthShouldReset ? nextMonthUtc() : row.chat_quota_month_reset_at;

    stream.on('finalMessage', () => {
      // Fire-and-forget. Any error here just means this successful call
      // didn't count — the user gets a bonus question instead of a broken UX.
      supabase
        .schema('astral')
        .from('profiles')
        .update({
          chat_quota_used_today: nextUsedToday,
          chat_quota_reset_at: dayResetAt,
          chat_quota_used_this_month: nextUsedThisMonth,
          chat_quota_month_reset_at: monthResetAt,
        })
        .eq('user_id', userId)
        .then(
          () => {},
          (e: unknown) => console.error('[chat] quota increment failed', e),
        );
    });
  }

  // Forward Anthropic's stream as an SSE-style text/event-stream. We emit
  // typed JSON events so the client can differentiate text deltas from errors.
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (evt: { type: string; [k: string]: unknown }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      };
      stream.on('text', (delta: string) => send({ type: 'text', delta }));
      stream.on('error', (err: unknown) => {
        console.error('[chat] stream error', err);
        send({ type: 'error', message: 'stream-error' });
      });
      stream.on('end', () => {
        send({ type: 'done' });
        controller.close();
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
