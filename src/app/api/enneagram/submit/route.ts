// MIGRATION: alter table astral.profiles add column if not exists enneagram jsonb;
//
// /api/enneagram/submit — POST.
//
// Accepts the 36-question Likert map, scores it via the engine, and upserts
// the result onto astral.profiles.enneagram (jsonb). Auth is Clerk-gated,
// writes use the service-role client (RLS bypass) and are always scoped to
// the authenticated user's own row — no cross-user writes possible.
//
// Returns the scored EnneagramResult so the client can render the profile
// immediately without a follow-up round-trip.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { scoreAssessment, type EnneagramResult } from '@/lib/engines/enneagram';
import { ENNEAGRAM_QUESTIONS } from '@/lib/interp/enneagram-questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Service-role server client that bypasses RLS. Mirrors the pattern in
// /api/profile — safe because Clerk auth gates every request and we only
// ever touch the caller's own user_id row.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'astral' },
  });
}

type SubmitBody = {
  answers?: Record<string, number>;
};

function coerceAnswers(
  raw: Record<string, number> | undefined,
): Record<string, 1 | 2 | 3 | 4 | 5> | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Record<string, 1 | 2 | 3 | 4 | 5> = {};
  const validIds = new Set(ENNEAGRAM_QUESTIONS.map((q) => q.id));
  for (const [id, v] of Object.entries(raw)) {
    if (!validIds.has(id)) continue;
    const n = Math.round(Number(v));
    if (n < 1 || n > 5) return null;
    out[id] = n as 1 | 2 | 3 | 4 | 5;
  }
  // Require at least a minimum quorum of answers — anything less than every
  // question and we return a shaped 400 so the UI can tell the reader to
  // finish.
  if (Object.keys(out).length < ENNEAGRAM_QUESTIONS.length) return null;
  return out;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const answers = coerceAnswers(body.answers);
  if (!answers) {
    return NextResponse.json(
      { error: 'invalid-answers', expected: ENNEAGRAM_QUESTIONS.length },
      { status: 400 },
    );
  }

  let result: EnneagramResult;
  try {
    result = scoreAssessment(answers);
  } catch (e) {
    console.error('[enneagram/submit] scoring failed', e);
    return NextResponse.json({ error: 'scoring-failed' }, { status: 500 });
  }

  // Persist to astral.profiles.enneagram. We stash both the scored result
  // and the raw answer map so we can re-score if the engine evolves without
  // losing the reader's data.
  const payload = {
    result,
    answers,
    taken_at: new Date().toISOString(),
    version: 1,
  };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      enneagram: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[enneagram/submit] upsert error', error.message);
    // Keep going — we still want to hand the result back to the reader even
    // if the persistence layer hiccups. The client can retry the POST.
    return NextResponse.json(
      { result, persisted: false, error: 'persist-failed', detail: error.message },
      { status: 200 },
    );
  }

  return NextResponse.json({ result, persisted: true });
}
