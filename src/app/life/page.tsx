// /life — life timeline of major / medium / minor transits across the
// user's whole lived life and ~50yr forward. The killer feature: users
// pin life events (job change, met partner, loss) and visually correlate
// with transits — Spotify Wrapped for their actual life.
//
// Tier gating (planned, not enforced yet at scaffold stage):
//   - The Two   (free)   →  ±2 years from today
//   - The Five  (reader) →  ±10 years
//   - The Seven (depth)  →  full life timeline + life-event annotations
//   - The Nine  (master) →  + AI life-narrative synthesis across decades
//
// Status: scaffold. Mock transit data, no Supabase persistence yet for
// pinned events, no AI narrative yet. The cross-tradition enrichment
// on click is real (calls src/lib/transit/cross-tradition.ts).

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import LifeTimeline from '@/components/LifeTimeline';
import BrandHome from '@/components/BrandHome';
import type { BirthData } from '@/lib/types';
import type { Tier } from '@/lib/tiers';

type Profile = { birthData: BirthData; tier: Tier };

async function loadProfile(clerkUserId: string): Promise<Profile | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false }, db: { schema: 'astral' } },
    );
    const { data, error } = await supabase
      .from('profiles')
      .select('birth_data, tier')
      .eq('user_id', clerkUserId)
      .maybeSingle();
    if (error) {
      console.error('[synastra] /life loadProfile error:', error.message);
      return null;
    }
    if (!data) return null;
    const birthData = data.birth_data as BirthData | null;
    if (!birthData) return null;
    const tier = (data.tier as Tier | null) || 'free';
    return { birthData, tier };
  } catch (e) {
    console.error('[synastra] /life loadProfile threw:', e);
    return null;
  }
}

export default async function LifePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const profile = await loadProfile(userId);
  if (!profile) redirect('/onboarding');
  return (
    <>
      <BrandHome />
      <LifeTimeline
        userId={userId}
        birthData={profile.birthData}
        tier={profile.tier}
      />
    </>
  );
}
