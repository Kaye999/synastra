import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Service-role server client that bypasses RLS.
// Safe because we authenticate via Clerk before every write and only allow
// the caller to write THEIR OWN user_id row. No cross-user writes possible.
//
// Note: do NOT set db.schema in the client config. Some supabase-js versions
// don't propagate the default schema into write headers (Content-Profile),
// which produces "Invalid path specified in request URL" on upsert. Instead
// we chain `.schema('astral')` explicitly on every query below — same pattern
// used in the cron + transit-alerts routes.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
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
    .schema('astral')
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        birth_data: birthData,
        first_name: firstName,
        // Only seed tier on INSERT. Upsert with a literal 'free' would
        // downgrade paying users every time they edit their birth data.
        // (Postgres on_conflict by default updates every provided column;
        // we exclude `tier` from conflict updates via ignoreDuplicates:false
        // + a separate safeguard below.)
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[synastra] /api/profile upsert error:', error.message);
    return NextResponse.json({ error: 'upsert-failed', detail: error.message }, { status: 500 });
  }

  // If this was an INSERT (no prior row), tier will still be null — set it
  // to 'free' once, but never overwrite an existing tier value.
  await supabase
    .schema('astral')
    .from('profiles')
    .update({ tier: 'free' })
    .eq('user_id', userId)
    .is('tier', null);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .schema('astral')
    .from('profiles')
    .select('birth_data, tier, first_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'fetch-failed', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

// Hard-deletes the user's profile row. Used by Settings → "Clear saved data &
// start over" and the same action inside the in-chart SettingsCog modal.
// Tier rows are deleted too — Stripe webhooks will recreate the tier on next
// payment if the user subscribes again.
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .schema('astral')
    .from('profiles')
    .delete()
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: 'delete-failed', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
