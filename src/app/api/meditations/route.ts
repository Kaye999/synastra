// GET /api/meditations
//
// Returns the meditation + breathing library for the current user. The Nine
// tier sees full listings; lower tiers see nothing (we hide the page link
// from them anyway, but enforce server-side too).
//
// Audio files live in the `meditations` private Supabase storage bucket.
// We DO NOT return playable URLs here — the client fetches a per-track
// signed URL on play via /api/meditations/[id]/signed-url. That keeps the
// MP3s gated behind a fresh per-request signature with a short TTL.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccess, type Tier } from '@/lib/tiers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MeditationRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: 'meditation' | 'breathing';
  duration_seconds: number;
  zodiac_season: string | null;
  tier_required: Tier;
  published: boolean;
  created_at: string;
};

export async function GET() {
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

  const q = await (supabase as unknown as {
    schema: (s: string) => { from: (t: string) => { select: (cols: string) => { eq: (col: string, val: boolean) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: MeditationRow[] | null }> } } } };
  })
    .schema('astral')
    .from('meditations')
    .select('id, slug, title, description, type, duration_seconds, zodiac_season, tier_required, published, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });

  return NextResponse.json({ meditations: q.data ?? [] });
}
