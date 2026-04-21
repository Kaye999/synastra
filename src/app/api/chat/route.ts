// /api/chat — streams Claude (claude-sonnet-4-6) responses to the Synastra
// oracle widget. Clerk-authed, tier-gated via Supabase `profiles.tier` and
// `profiles.chat_quota_used_today`.
//
// POST body: { messages: [{role, content}], chartContext: {...} }
// Response: text/event-stream of Anthropic message stream events (JSON lines
// prefixed with `data:`) so the client can render token-by-token.
//
// 401 → unauth. 402 → free tier. 429 → quota exceeded (body: {error, limit, used}).

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
const READER_DAILY_LIMIT = 10;
const UI_HISTORY_MAX = 10; // messages sent to the API per request (client also caps)

type IncomingMessage = { role: 'user' | 'assistant'; content: string };
type IncomingBody = {
  messages: IncomingMessage[];
  chartContext: unknown;
};

type ProfileRow = {
  tier: Tier;
  chat_quota_used_today: number | null;
  chat_quota_reset_at: string | null;
  first_name: string | null;
};

const SYSTEM_TEMPLATE = `You are the Synastra oracle — an interpreter trained on Western astrology, Vedic astrology, Kabbalah, numerology, and Chinese BaZi. You answer the user's questions about their chart, placements, transits, esoteric keywords, or the symbolic meaning of signs, houses, planets, sefirot, nakshatras, pillars.

The user's chart is provided below in JSON. Treat this as context. Cite specific placements when relevant. If asked a general question, answer clearly; if asked about themselves, read their chart.

Voice: editorial, observational, richly imaged, concise. No hedging ("might be", "could be", "sometimes"). Use concrete verbs. Short and long sentences mixed. No emoji. Refer to esoteric frameworks accurately.

Out of scope: medical advice, legal advice, relationship diagnosis of specific people, financial predictions. If asked, gently redirect to the symbolic/archetypal layer instead.

User's chart:
__CHART__

User's first name: __NAME__`;

function buildSystem(chartContext: unknown, firstName: string): string {
  let chartJson: string;
  try {
    chartJson = JSON.stringify(chartContext ?? {}, null, 2);
  } catch {
    chartJson = '{}';
  }
  return SYSTEM_TEMPLATE
    .replace('__CHART__', chartJson)
    .replace('__NAME__', firstName || 'friend');
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

function shouldResetQuota(resetAt: string | null): boolean {
  if (!resetAt) return true;
  const reset = Date.parse(resetAt);
  if (!Number.isFinite(reset)) return true;
  return Date.now() >= reset;
}

// Next midnight UTC. (Keep server-side reset simple; "user-local" midnight
// would require their tz — out of scope until we persist that on profiles.)
function nextMidnightUtc(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
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

  // Load profile — tier + today's quota counter.
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileErr } = await supabase
    .schema('astral')
    .from('profiles')
    .select('tier, chat_quota_used_today, chat_quota_reset_at, first_name')
    .eq('user_id', userId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'profile-not-found' }, { status: 404 });
  }

  const row = profile as ProfileRow;
  const tier: Tier = row.tier;

  if (tier === 'free') {
    return NextResponse.json(
      { error: 'upgrade-required', message: 'Upgrade to ask the AI' },
      { status: 402 },
    );
  }

  // Quota check for reader tier.
  let used = row.chat_quota_used_today ?? 0;
  if (tier === 'reader') {
    if (shouldResetQuota(row.chat_quota_reset_at)) {
      used = 0;
    }
    if (used >= READER_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'quota-exceeded', limit: READER_DAILY_LIMIT, used },
        { status: 429 },
      );
    }
  }

  // Anthropic call
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'server-misconfigured' }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey });

  const system = buildSystem(body.chartContext, row.first_name || '');

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  // On successful completion, increment the quota counter for reader tier.
  if (tier === 'reader') {
    const nextUsed = used + 1;
    const resetAt = shouldResetQuota(row.chat_quota_reset_at) ? nextMidnightUtc() : row.chat_quota_reset_at;
    stream.on('finalMessage', () => {
      // Fire-and-forget. Any error here just means this successful call
      // didn't count — the user gets a bonus question instead of a broken UX.
      supabase
        .schema('astral')
        .from('profiles')
        .update({ chat_quota_used_today: nextUsed, chat_quota_reset_at: resetAt })
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
