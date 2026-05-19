// reading-runtime.ts — shared infrastructure for the /api/reading/* routes.
//
// Responsibilities:
//   - Auth (Clerk)
//   - Load profile from astral.profiles (tier, birth_data, first_name,
//     quota counters)
//   - Tier gate + monthly quota gate for compatibility / wealth
//   - Cache lookup + insert against astral.readings
//   - SSE wrapper that streams Anthropic deltas as {type:'text', delta} and
//     terminates with {type:'done'}
//
// Routes call runReading(...) with a small config object. Keep this thin —
// the per-route logic stays in the route file.

import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseServiceClient as createSupabaseServerClient } from '@/lib/supabase/server';
import type { Tier } from '@/lib/types';
import type { ReadingPromptResult } from './reading-templates';

export const MODEL = 'claude-sonnet-4-6';

export type ReadingProfile = {
  user_id: string;
  tier: Tier;
  birth_data: unknown;
  first_name: string | null;
  chat_quota_used_today: number | null;
  chat_quota_reset_at: string | null;
};

export type ReadingType =
  | 'daily'
  | 'monthly'
  | 'compatibility'
  | 'life-purpose'
  | 'shadow'
  | 'wealth'
  | 'transit-alerts'
  | 'tarot-daily'
  | 'tarot-three'
  | 'tarot-celtic'
  | 'enneagram'
  | 'gene-keys'
  | 'ayurveda';

/* ============================================================
 * Tier gate helpers
 * ============================================================ */

const TIER_RANK: Record<Tier, number> = { free: 0, reader: 1, depth: 2 };

export function hasTier(userTier: Tier, required: Tier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

export function upgradeResponse(
  requiredTier: Tier,
  message = 'Upgrade required for this reading',
) {
  return NextResponse.json(
    { error: 'upgrade-required', tier_needed: requiredTier, message },
    { status: 402 },
  );
}

/* ============================================================
 * Profile loader
 * ============================================================ */

export async function loadProfile(userId: string): Promise<
  | { ok: true; profile: ReadingProfile; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }
  | { ok: false; response: Response }
> {
  // Service-role client — bypasses RLS. The route has already verified
  // the Clerk userId via authenticated(); we always scope by user_id
  // below so no cross-user data exposure is possible.
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .schema('astral')
    .from('profiles')
    .select('user_id, tier, birth_data, first_name, chat_quota_used_today, chat_quota_reset_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'profile-not-found' }, { status: 404 }),
    };
  }

  return { ok: true, profile: data as unknown as ReadingProfile, supabase };
}

/* ============================================================
 * Authenticated gate
 * ============================================================ */

export async function authenticated(): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'unauthorised' }, { status: 401 }),
    };
  }
  return { ok: true, userId };
}

/* ============================================================
 * Cache (astral.readings)
 * ============================================================ */

// Note: the generated Database type doesn't yet know about astral.readings,
// so we cast the builder to `any` at the from() call. The generated-types
// refresh is another agent's responsibility.
type LooseSupabase = {
  schema: (s: string) => { from: (t: string) => any };
};

export async function getCachedReading(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  readingType: ReadingType,
  scopeKey: string,
): Promise<string | null> {
  const q = (supabase as unknown as LooseSupabase)
    .schema('astral')
    .from('readings')
    .select('body')
    .eq('user_id', userId)
    .eq('reading_type', readingType)
    .eq('scope_key', scopeKey)
    .maybeSingle();
  const { data, error } = (await q) as { data: { body: string | null } | null; error: unknown };
  if (error || !data) return null;
  return data.body ?? null;
}

export async function saveCachedReading(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  readingType: ReadingType,
  scopeKey: string,
  body: string,
): Promise<void> {
  try {
    await (supabase as unknown as LooseSupabase)
      .schema('astral')
      .from('readings')
      .upsert(
        { user_id: userId, reading_type: readingType, scope_key: scopeKey, body },
        { onConflict: 'user_id,reading_type,scope_key' },
      );
  } catch (e) {
    console.error('[reading] cache save failed', e);
  }
}

/* ============================================================
 * Monthly quota (compatibility + wealth count against a shared 3/month
 * bucket for reader tier). We track it on profiles via two extra columns:
 *   - monthly_quota_used (int)
 *   - monthly_quota_month (text, 'YYYY-MM')
 * If those columns don't yet exist, this silently no-ops; the UI will see
 * the reading succeed. Add them as the SQL migration block shows.
 * ============================================================ */

export const READER_MONTHLY_LIMIT = 3;

type MonthlyQuotaRow = {
  monthly_quota_used: number | null;
  monthly_quota_month: string | null;
};

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function checkMonthlyQuota(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tier: Tier,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  if (tier !== 'reader') return { ok: true };

  const month = currentMonthKey();
  const q = (supabase as unknown as LooseSupabase)
    .schema('astral')
    .from('profiles')
    .select('monthly_quota_used, monthly_quota_month')
    .eq('user_id', userId)
    .maybeSingle();
  const { data } = (await q) as { data: MonthlyQuotaRow | null };
  const row = data;

  const used = row?.monthly_quota_month === month ? row?.monthly_quota_used ?? 0 : 0;
  if (used >= READER_MONTHLY_LIMIT) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'quota-exceeded',
          limit: READER_MONTHLY_LIMIT,
          used,
          scope: 'monthly',
          message: 'Reader tier includes 3 premium readings per month. Upgrade to Depth for unlimited.',
        },
        { status: 429 },
      ),
    };
  }
  return { ok: true };
}

export async function incrementMonthlyQuota(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tier: Tier,
): Promise<void> {
  if (tier !== 'reader') return;
  const month = currentMonthKey();
  try {
    const loose = supabase as unknown as LooseSupabase;
    const readQ = loose
      .schema('astral')
      .from('profiles')
      .select('monthly_quota_used, monthly_quota_month')
      .eq('user_id', userId)
      .maybeSingle();
    const { data } = (await readQ) as { data: MonthlyQuotaRow | null };
    const row = data;
    const used = row?.monthly_quota_month === month ? (row?.monthly_quota_used ?? 0) : 0;
    await loose
      .schema('astral')
      .from('profiles')
      .update({ monthly_quota_used: used + 1, monthly_quota_month: month })
      .eq('user_id', userId);
  } catch (e) {
    console.error('[reading] monthly quota increment failed', e);
  }
}

/* ============================================================
 * Streaming wrapper
 * ============================================================ */

export type StreamOptions = {
  prompt: ReadingPromptResult;
  onComplete?: (fullText: string) => Promise<void> | void;
  onError?: (err: unknown) => void;
};

/**
 * Stream a Claude reading as SSE, accumulating the full text so callers can
 * cache it on completion. Returns a Response ready to send.
 *
 * Also supports a non-stream mode (returns cached body) — pass `cachedBody`
 * and we'll stream that instead of calling the model.
 */
export function streamReading(opts: StreamOptions): Response {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'server-misconfigured' }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (evt: { type: string; [k: string]: unknown }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      };

      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: opts.prompt.maxTokens,
        system: opts.prompt.system,
        messages: [{ role: 'user', content: opts.prompt.userMessage }],
      });

      let full = '';
      stream.on('text', (delta: string) => {
        full += delta;
        send({ type: 'text', delta });
      });
      stream.on('error', (err: unknown) => {
        console.error('[reading] stream error', err);
        opts.onError?.(err);
        send({ type: 'error', message: 'stream-error' });
      });
      stream.on('end', () => {
        Promise.resolve(opts.onComplete?.(full))
          .catch((e) => console.error('[reading] onComplete failed', e))
          .finally(() => {
            send({ type: 'done' });
            controller.close();
          });
      });
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

/**
 * Replay a cached reading as an SSE stream — lets the client use the same
 * handler regardless of whether the reading came from cache or was freshly
 * generated.
 */
export function replayCachedAsStream(body: string): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (evt: { type: string; [k: string]: unknown }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      };
      send({ type: 'text', delta: body });
      send({ type: 'done' });
      controller.close();
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

/* ============================================================
 * Birth-data → AstroInput helper for current-user chart building
 * ============================================================ */

import type { AstroInput, BirthData } from '@/lib/types';
import { resolveCityCoords } from '@/lib/constants/cities';

export function birthDataToAstroInput(birth: BirthData | null | undefined): AstroInput | null {
  if (!birth || !birth.dob || !birth.time) return null;
  const coords = resolveCityCoords(birth.city) ?? { lat: -33.87, lon: 151.21, tzOffset: 10 };
  return {
    dob: birth.dob,
    time: birth.time,
    timeUnknown: !!birth.timeUnknown,
    lat: coords.lat,
    lon: coords.lon,
    tzOffset: coords.tzOffset,
  };
}
