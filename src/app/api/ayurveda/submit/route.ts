// MIGRATION: alter table astral.profiles add column if not exists ayurveda jsonb;
//
// /api/ayurveda/submit — POST. Auth-gated prakruti submission.
//
// Accepts a body of { answers: Record<questionId, 'vata'|'pitta'|'kapha'> },
// runs it through the scoring engine, and stores the resulting Prakruti on the
// reader's astral.profiles row under the `ayurveda` jsonb column via the
// service-role client (same pattern as /api/profile).
//
// Returns the computed Prakruti so the calling component can hand it straight
// to <AyurvedaProfile /> without an extra round-trip.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { scoreConstitution, type Dosha, type Prakruti } from '@/lib/engines/ayurveda';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Service-role client scoped to the astral schema. Safe because we authenticate
// via Clerk before every write and only ever write to the caller's own row.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'astral' },
  });
}

function isDosha(v: unknown): v is Dosha {
  return v === 'vata' || v === 'pitta' || v === 'kapha';
}

function sanitizeAnswers(input: unknown): Record<string, Dosha> | null {
  if (!input || typeof input !== 'object') return null;
  const out: Record<string, Dosha> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof k !== 'string' || !k) continue;
    if (!isDosha(v)) continue;
    out[k] = v;
  }
  if (Object.keys(out).length === 0) return null;
  return out;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { answers?: unknown };
  try {
    body = (await req.json()) as { answers?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const answers = sanitizeAnswers(body.answers);
  if (!answers) {
    return NextResponse.json({ error: 'invalid-answers' }, { status: 400 });
  }

  const prakruti: Prakruti = scoreConstitution(answers);

  const payload = {
    ...prakruti,
    answers,
    completed_at: new Date().toISOString(),
    version: 1,
  };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      ayurveda: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[ayurveda/submit] update error:', error.message);
    return NextResponse.json(
      { error: 'upsert-failed', detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, result: prakruti });
}
