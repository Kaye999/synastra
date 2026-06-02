// Today — daily/monthly home. Daily Ritual strip, Morning Cup, and The Arc
// live here, separate from the seven tradition deep-reads on /chart.
//
// Profile fetch mirrors /chart/page.tsx — same Clerk auth + Supabase service-role
// read against astral.profiles. Redirects to /sign-in or /onboarding when
// preconditions aren't met.

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import TodayClient from './TodayClient';
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
      console.error('[synastra] loadProfile error:', error.message);
      return null;
    }
    if (!data) return null;
    const birthData = data.birth_data as BirthData | null;
    if (!birthData) return null;
    const tier = (data.tier as Tier | null) || 'free';
    return { birthData, tier };
  } catch (e) {
    console.error('[synastra] loadProfile threw:', e);
    return null;
  }
}

export default async function TodayPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const profile = await loadProfile(userId);
  if (!profile) redirect('/onboarding');
  return <TodayClient user={profile.birthData} tier={profile.tier} />;
}
