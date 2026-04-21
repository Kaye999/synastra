// /api/stripe/checkout — placeholder. Another agent wires real checkout sessions.

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tier = url.searchParams.get('tier');
  return NextResponse.json(
    {
      error: 'Not implemented',
      tier,
      note: 'Another agent will wire /api/stripe/checkout to create a Stripe Checkout session.',
    },
    { status: 501 },
  );
}
