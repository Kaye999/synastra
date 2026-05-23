// POST /api/voice/tts
//
// Text-to-speech for the Oracle's responses + (later) meditation audio
// generation. Streams MP3 audio back to the client using ElevenLabs.
//
// Body: { text: string, voiceId?: string }
// Response: audio/mpeg stream
//
// Voice gating: same as /api/chat — reader+ tier required. (Free tier
// users still see the voice toggle but get a 402 if they try to use it.)

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccess, type Tier } from '@/lib/tiers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Default voice — Rachel, a calm warm female. Switchable per request via
// voiceId. ElevenLabs Starter has access to all stock voices.
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

// Cap per-request text to keep latency bounded and the bill under control.
// 600 chars ≈ 60-90 seconds of speech. Anything longer should be chunked
// or streamed via SSE.
const MAX_CHARS = 1200;

type Body = { text?: string; voiceId?: string };

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const profileQ = await (supabase as unknown as {
    schema: (s: string) => { from: (t: string) => { select: (c: string) => { eq: (col: string, v: string) => { maybeSingle: () => Promise<{ data: { tier?: Tier } | null }> } } } };
  })
    .schema('astral')
    .from('profiles')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle();

  const tier: Tier = (profileQ.data?.tier ?? 'free') as Tier;
  if (!canAccess(tier, 'reader')) {
    return NextResponse.json(
      { error: 'upgrade-required', requires: 'reader' },
      { status: 402 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }
  const text = (body.text ?? '').slice(0, MAX_CHARS).trim();
  if (!text) {
    return NextResponse.json({ error: 'text-required' }, { status: 400 });
  }
  const voiceId = body.voiceId || DEFAULT_VOICE_ID;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'tts-not-configured' }, { status: 500 });
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=2`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return NextResponse.json(
      { error: 'tts-upstream-failed', status: upstream.status, detail: detail.slice(0, 200) },
      { status: 502 },
    );
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, no-store',
    },
  });
}
