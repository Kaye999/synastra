// GET /api/meditations/[id]/signed-url
//
// Returns a short-lived signed URL for the requested meditation's audio
// file. Gated to The Nine — lower tiers receive 402. The URL is valid for
// 1 hour, which is enough for a single play session without leaking
// playable links to non-subscribers.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccess, type Tier } from '@/lib/tiers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIGN_TTL_SECONDS = 60 * 60;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const profileQ = await (supabase as unknown as {
    schema: (s: string) => { from: (t: string) => { select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { tier?: Tier } | null }> } } } };
  })
    .schema('astral')
    .from('profiles')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle();

  const tier: Tier = (profileQ.data?.tier ?? 'free') as Tier;
  if (!canAccess(tier, 'master')) {
    return NextResponse.json({ error: 'upgrade-required', requires: 'master' }, { status: 402 });
  }

  const medQ = await (supabase as unknown as {
    schema: (s: string) => { from: (t: string) => { select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { storage_path?: string; published?: boolean } | null }> } } } };
  })
    .schema('astral')
    .from('meditations')
    .select('storage_path, published')
    .eq('id', id)
    .maybeSingle();

  const med = medQ.data;
  if (!med || !med.published || !med.storage_path) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const signed = await supabase.storage
    .from('meditations')
    .createSignedUrl(med.storage_path, SIGN_TTL_SECONDS);

  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json({ error: 'sign-failed' }, { status: 500 });
  }

  return NextResponse.json({ url: signed.data.signedUrl, expiresIn: SIGN_TTL_SECONDS });
}
