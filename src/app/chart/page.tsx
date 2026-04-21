// Chart dashboard — server component. Loads the user's profile (placeholder) and
// renders the client-side <Dashboard>. If the `?demo=1` query is set, renders
// with a demo profile instead of redirecting to onboarding.

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Dashboard from '@/components/Dashboard';
import type { BirthData, Tier } from '@/lib/types';

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

// Placeholder profile loader. Another agent wires the real Supabase query.
async function loadProfile(clerkUserId: string): Promise<Profile | null> {
  void clerkUserId;
  // TODO — select from profiles where clerk_user_id = ? in Supabase.
  return null;
}

export default async function ChartPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;
  const isDemo = sp.demo === '1';

  if (isDemo) {
    return <ClientShell profile={DEMO_PROFILE} />;
  }

  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const profile = await loadProfile(userId);
  if (!profile) redirect('/onboarding');

  return <ClientShell profile={profile} />;
}

function ClientShell({ profile }: { profile: Profile }) {
  return (
    <Dashboard
      user={profile.birthData}
      tier={profile.tier}
      // onReset is a client-side concern; for the server-component shell we just
      // hand off a no-op prop. The real reset logic will be wired by the auth/UX
      // agent when persistence lands.
      onReset={() => { /* no-op */ }}
    />
  );
}
