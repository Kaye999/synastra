// Chart dashboard — server component. Loads the user's profile from Supabase
// (astral.profiles keyed by Clerk userId) and renders the client-side
// <Dashboard>. Supports:
//   - ?demo=1   → no auth, tier='depth', Ethan's demo data
//   - ?upgraded=1 → show "Welcome to Depth" success banner

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Dashboard from '@/components/Dashboard';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { BirthData } from '@/lib/types';
import type { Tier } from '@/lib/tiers';

type Profile = { birthData: BirthData; tier: Tier };

const DEMO_PROFILE: Profile = {
  tier: 'depth',
  birthData: {
    name: 'Ethan',
    fullName: 'Ethan Joshua Kay',
    dob: { y: 2004, m: 7, d: 23 },
    time: { h: 6, m: 30 },
    timeUnknown: false,
    city: 'Sydney',
    gender: 'male',
  },
};

// Pull `{birthData, tier}` from astral.profiles for a given Clerk user id.
// Returns null if there's no row (→ caller should redirect to /onboarding).
async function loadProfile(clerkUserId: string): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .schema('astral')
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

export default async function ChartPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; upgraded?: string }>;
}) {
  const sp = await searchParams;
  const isDemo = sp.demo === '1';
  const isUpgraded = sp.upgraded === '1';

  if (isDemo) {
    return <ClientShell profile={DEMO_PROFILE} upgraded={false} />;
  }

  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const profile = await loadProfile(userId);
  if (!profile) redirect('/onboarding');

  return <ClientShell profile={profile} upgraded={isUpgraded} />;
}

function ClientShell({ profile, upgraded }: { profile: Profile; upgraded: boolean }) {
  return (
    <>
      {upgraded && <UpgradeBanner tier={profile.tier} />}
      <Dashboard
        user={profile.birthData}
        tier={profile.tier}
        // onReset is a client-side concern; for the server-component shell we just
        // hand off a no-op prop. The real reset logic will be wired by the auth/UX
        // agent when persistence lands.
        onReset={() => { /* no-op */ }}
      />
    </>
  );
}

function UpgradeBanner({ tier }: { tier: Tier }) {
  const label = tier === 'depth' ? 'Depth' : tier === 'reader' ? 'Reader' : 'Synastra';
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(12, 10, 14, 0.94)',
        border: '1px solid var(--brass, #C8A052)',
        padding: '12px 20px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--brass, #C8A052)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
      }}
    >
      Welcome to {label}. Refresh to see the full chart.
    </div>
  );
}
