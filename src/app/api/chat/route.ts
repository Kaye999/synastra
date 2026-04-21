// /api/chat — placeholder. Another agent wires the real streaming Anthropic call.

import { NextResponse } from 'next/server';

export async function POST(_req: Request) {
  return NextResponse.json(
    {
      error: 'Not implemented',
      note: 'Another agent will wire /api/chat to the Anthropic SDK and stream responses.',
    },
    { status: 501 },
  );
}
