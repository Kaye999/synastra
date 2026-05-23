// GET /api/pdf/moon-journal?cycle=N — returns a printable 28-day moon
// journal PDF. The Nine subscribers only.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccess, type Tier } from '@/lib/tiers';
import { buildMoonJournalBuffer, moonJournalFilename } from '@/lib/pdf/moon-journal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const profileQ = await (supabase as unknown as {
    schema: (s: string) => { from: (t: string) => { select: (c: string) => { eq: (col: string, v: string) => { maybeSingle: () => Promise<{ data: { tier?: Tier; first_name?: string } | null }> } } } };
  })
    .schema('astral')
    .from('profiles')
    .select('tier, first_name')
    .eq('user_id', userId)
    .maybeSingle();

  const tier: Tier = (profileQ.data?.tier ?? 'free') as Tier;
  if (!canAccess(tier, 'master')) {
    return NextResponse.json({ error: 'upgrade-required', requires: 'master' }, { status: 402 });
  }

  const firstName = profileQ.data?.first_name || 'Reader';
  const cycleParam = Number(req.nextUrl.searchParams.get('cycle') ?? '1');
  const cycle = Number.isFinite(cycleParam) && cycleParam > 0 ? Math.floor(cycleParam) : 1;
  const pdf = buildMoonJournalBuffer({ firstName, cycleNumber: cycle });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${moonJournalFilename(cycle)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
