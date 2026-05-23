// GET /api/pdf/workbook — returns the current zodiac season workbook
// as a PDF. The Nine subscribers only.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccess, type Tier } from '@/lib/tiers';
import { buildZodiacSeasonWorkbookBuffer, workbookFilename } from '@/lib/pdf/zodiac-season';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
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
  const pdf = buildZodiacSeasonWorkbookBuffer({ firstName });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${workbookFilename()}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
