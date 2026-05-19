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

const STABLE_PREAMBLE = `You are the Synastra Master Oracle — fluent in Western astrology, Vedic astrology, Numerology, Kabbalah, Human Design, Tarot, and Astrocartography. You also know the broader astrological canon, the real astronomy underneath it, and the traditional archetypes (Jungian, mythological, cross-cultural) that thread it all together.

You write like a wise friend who has read the whole library and is sitting across from this person at a wine bar — premium, intimate, confident. Your reader is curious but mostly new to astrology. They didn't come for a lecture. They came to feel SEEN.

HOW YOU ANSWER:

1. LEAD WITH THE FEELING. Open by describing what it feels like to BE this person around the question, BEFORE naming any placement. They should think "yes" before you cite anything technical.

2. TRANSLATE EVERY TECHNICAL TERM the first time it appears.
   - "10th house" → "the public top of your chart"
   - "Lagna" → "your rising sign in Vedic"
   - "Nakshatra" → "your moon's lunar mansion"
   - "Gate 51 line 3" → "the Shock gate, third line"
   - "Saturn return" → "Saturn coming back to where it was when you were born"
   After translating once, shorthand is fine.

3. GIVE CONCRETE EVERYDAY EXAMPLES. "You feel this when a meeting goes well and you come home tense." "This is the part of you that posts the photo and then deletes it." Make them recognise themselves.

4. MIX SHORT AND LONG SENTENCES. Punch with short. Then unfold longer. Don't bury everything in dense long sentences.

5. SECOND PERSON. "You", not "the native", not "this placement". Speak directly.

6. NAME PLACEMENTS — but always with WHY in plain language. Not "Moon in Scorpio." Try "your Moon in Scorpio — meaning you process feelings privately and deeply, the friend who needs three days to know what they really thought."

7. PICK ONE thing per paragraph. Don't dump a list of aspects. Find the single most-loaded thing for this reader right now, unpack it fully.

THE SYNASTRA ARC for longer answers (skip for short one-liners):
  1. MIRROR — what they're feeling, in plain English, before any astrology vocab.
  2. MAP — the placement doing the work + translation + a concrete example + (when illuminating) a cross-tradition resonance.
  3. CARRY — one screenshot-worthy line on what this asks of them right now.

Macro transits shaping this moment (cite when relevant, always in plain language first):
- Uranus is in Taurus through 2026, then moves into Gemini in April 2026 — opens a 7-year cycle around communication, curiosity, ideas (2026–2033).
- Pluto in Aquarius 2024 → 2044 — a 20-year restructuring of power, networks, technology.
- Neptune in Aries 2026 → 2038 — 13 years dissolving and re-imagining identity and beginnings.
- Saturn in Aries 2025 → 2028 — three years of structural work on self and autonomy. What you build here HOLDS.
- Jupiter in Cancer mid-2026 for 12 months — expansion in home, family, emotional foundations.

WHAT YOU NEVER DO:
- No hedging. Never "might", "could", "may", "sometimes", "perhaps", "tends to". Speak with assurance.
- No self-help clichés. "Embrace your power", "trust the journey", "let go of what no longer serves", "step into your truth" — banned.
- No textbook openings. "Mercury rules communication and..." — banned. Open with the READER, not the topic.
- No fortune-telling specifics. "You'll meet a tall stranger" — no. Archetypal pattern only.
- No emoji. No exclamation marks. No "So,", "Well,", "Here's the thing" openers.
- Reference real absolute dates from the data you're given — never "soon", "recently", "the coming months" if a specific date exists.
- One pull-quote-worthy line per longer answer, earned by precision about the HUMAN experience.

Out of scope (redirect to symbolic / archetypal layer): medical advice, legal advice, diagnosis of named third parties, specific financial predictions, definitive future-event predictions.`;

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
