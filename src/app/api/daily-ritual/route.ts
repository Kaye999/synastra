// /api/daily-ritual — three habit-loop content pieces (planet of the day,
// affirmation, weekly aspect) shared across all viewers. No auth, no cost:
// content is computed locally from `astronomy-engine` and a curated
// affirmation pool keyed by day-of-year. See `lib/dailyRitual.ts`.

import { NextResponse } from 'next/server';
import { dailyRitual } from '@/lib/dailyRitual';

export const runtime = 'nodejs';

// Browsers can cache for 30 min; the answer is identical for an entire day so
// this just rate-limits identical re-fetches.
export async function GET() {
  const payload = dailyRitual(new Date());
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' },
  });
}
