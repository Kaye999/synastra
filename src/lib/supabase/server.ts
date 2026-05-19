// Server-side Supabase clients.
//
// Two flavours, picked deliberately at the callsite:
//
//   createSupabaseServerClient()
//     - Anon key, reads cookies via next/headers.
//     - Honours RLS via Supabase's own `auth.uid()`.
//     - We DON'T currently use Supabase auth (Clerk handles auth) so RLS
//       policies like `(auth.uid())::text = user_id` will never match a
//       row in practice. Reserved for any future flow that genuinely
//       authenticates through Supabase.
//
//   createSupabaseServiceClient()  ← use this from authed API routes
//     - Service-role key. Bypasses RLS.
//     - Safe BECAUSE the route already verified the Clerk userId via
//       authenticated() before touching the DB. We always scope queries
//       to `.eq('user_id', userId)` so the service role cannot leak data
//       across users.
//     - Matches the inline pattern already in /api/profile/route.ts and
//       /api/stripe/webhook/route.ts.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components can't write cookies; ignore.
        }
      },
    },
  });
}

/**
 * Service-role server client for routes that authenticate via Clerk before
 * any DB read. Bypasses RLS — callers MUST scope every query to the
 * authenticated user's userId.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
