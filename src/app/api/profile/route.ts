import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Service-role server client that bypasses RLS.
// Safe because we authenticate via Clerk before every write and only allow
// the caller to write THEIR OWN user_id row. No cross-user writes possible.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'astral' },
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { birthData?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const birthData = body.birthData;
  if (!birthData || typeof birthData !== 'object') {
    return NextResponse.json({ error: 'missing-birth-data' }, { status: 400 });
  }

  const clerkUser = await currentUser();
  const firstName = clerkUser?.firstName ?? null;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        birth_data: birthData,
        first_name: firstName,
        tier: 'free',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[synastra] /api/profile upsert error:', error.message);
    return NextResponse.json({ error: 'upsert-failed', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('birth_data, tier, first_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'fetch-failed', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
