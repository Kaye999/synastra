"use client";

// Onboarding page — client wrapper around <Onboarding>. On submit, writes
// the user's birth data + default tier ('free') to astral.profiles via the
// RLS-aware Supabase browser client, then redirects to /chart.
//
// Uses Clerk's useUser() to stamp user_id. RLS policies (see tiers.ts)
// ensure users can only read/write their own row — service role bypasses
// RLS for the Stripe webhook.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Onboarding from '@/components/Onboarding';
import type { BirthData } from '@/lib/types';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  const handleSave = async (birthData: BirthData) => {
    setErr('');

    if (!isLoaded) {
      setErr('Still loading your account — please try again in a moment.');
      return;
    }
    if (!user) {
      router.push('/sign-in');
      return;
    }

    setSaving(true);
    try {
      // POST to server API — uses service role to upsert, bypasses Clerk<>Supabase JWT setup.
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthData }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[synastra] /api/profile failed:', body);
        setErr('Could not save your chart. Please try again.');
        setSaving(false);
        return;
      }

      router.push('/chart');
    } catch (e) {
      console.error('[synastra] onboarding threw:', e);
      setErr('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <>
      <Onboarding onSave={handleSave} />
      {(saving || err) && (
        <div
          role={err ? 'alert' : 'status'}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'rgba(12, 10, 14, 0.94)',
            border: `1px solid ${err ? '#d66' : 'var(--brass, #C8A052)'}`,
            padding: '12px 20px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: err ? '#f8b6b6' : 'var(--brass, #C8A052)',
          }}
        >
          {err || 'Casting your atlas…'}
        </div>
      )}
    </>
  );
}
