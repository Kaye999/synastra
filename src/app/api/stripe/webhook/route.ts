// /api/stripe/webhook — placeholder. Another agent wires real signature
// verification and event handling.

import { NextResponse } from 'next/server';

export async function POST(_req: Request) {
  return NextResponse.json(
    {
      error: 'Not implemented',
      note: 'Another agent will wire /api/stripe/webhook to verify signatures and upsert tier in Supabase.',
    },
    { status: 501 },
  );
}
