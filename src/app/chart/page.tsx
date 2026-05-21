// Chart dashboard — server component. Loads the user's profile from Supabase
// (astral.profiles keyed by Clerk userId) and renders the client-side
// <Dashboard>. Supports:
//   - ?demo=1   → no auth, tier='depth', J.P. Morgan's birth data as the
//                 canonical demo (ties to the brand hero quote)
//   - ?upgraded=1 → show "Welcome to Depth" success banner

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Dashboard from '@/components/Dashboard';
import type { BirthData } from '@/lib/types';
import type { Tier } from '@/lib/tiers';

type Profile = { birthData: BirthData; tier: Tier };

// J.P. Morgan — Apr 17 1837, 03:00 LMT, Hartford, Connecticut.
// Canonical demo chart: ties to the brand hero quote ("Millionaires don't
// use astrology — billionaires do"). Historical fact, no personal data.
const DEMO_PROFILE: Profile = {
  tier: 'depth',
  birthData: {
    name: 'John',
    fullName: 'John Pierpont Morgan',
    dob: { y: 1837, m: 4, d: 17 },
    time: { h: 3, m: 0 },
    timeUnknown: false,
    city: 'Hartford',
    gender: 'male',
  },
};

// Pull `{birthData, tier}` from astral.profiles for a given Clerk user id.
// Returns null if there's no row (→ caller should redirect to /onboarding).
async function loadProfile(clerkUserId: string): Promise<Profile | null> {
  try {
    // Service-role client bypasses RLS — safe because we only read by authenticated userId.
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

export default async function ChartPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const sp = await searchParams;
  const isUpgraded = sp.upgraded === '1';

  // Demo flow removed 2026-05-20 — free users land at /onboarding to cast
  // their own chart instead of looking at someone else's. DEMO_PROFILE
  // kept on disk for reference / re-use if a future "tour" feature lands.
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
      {/* No onReset from server component — Dashboard's SettingsCog handles reset via /api/profile DELETE + router.push */}
      <Dashboard user={profile.birthData} tier={profile.tier} />
    </>
  );
}

function UpgradeBanner({ tier }: { tier: Tier }) {
  const label =
    tier === 'master'
      ? 'The Nine'
      : tier === 'depth'
        ? 'The Seven'
        : tier === 'reader'
          ? 'The Five'
          : 'Synastra';
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
