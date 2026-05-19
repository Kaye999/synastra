"use client";

// Onboarding page — client wrapper around <Onboarding>. On submit, writes
// the user's birth data + default tier ('free') to astral.profiles via the
// service-role API route, then redirects to /chart.
//
// Auth flow (hardened 2026-05-19):
//   1. If Clerk is still loading → show inline message in the banner.
//   2. If user not signed in → don't silently bounce; show a clear
//      "Sign in first" CTA so they understand why nothing happens.
//   3. If signed in → POST /api/profile, on success push /chart.
//
// Every state has visible feedback near the button so the user never
// feels like "nothing happened".

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Onboarding from '@/components/Onboarding';
import type { BirthData } from '@/lib/types';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'saving' }
  | { kind: 'auth-required' }
  | { kind: 'error'; message: string }
  | { kind: 'success' };

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleSave = async (birthData: BirthData) => {
    if (!isLoaded) {
      setStatus({ kind: 'loading' });
      return;
    }
    if (!user) {
      setStatus({ kind: 'auth-required' });
      return;
    }

    setStatus({ kind: 'saving' });
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthData }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[synastra] /api/profile failed:', body);
        const detail =
          typeof (body as { detail?: unknown }).detail === 'string'
            ? (body as { detail: string }).detail
            : typeof (body as { error?: unknown }).error === 'string'
              ? (body as { error: string }).error
              : 'unknown';
        setStatus({ kind: 'error', message: `Could not save your chart — ${detail}` });
        return;
      }

      setStatus({ kind: 'success' });
      // Small delay so the user sees the success state before the redirect.
      setTimeout(() => router.push('/chart'), 600);
    } catch (e) {
      console.error('[synastra] onboarding threw:', e);
      setStatus({ kind: 'error', message: 'Something went wrong. Please try again.' });
    }
  };

  // Disable the button while saving / success.
  const isBusy = status.kind === 'saving' || status.kind === 'success';

  return (
    <>
      <Onboarding
        onSave={handleSave}
        submitDisabled={isBusy}
        submitLabel={
          status.kind === 'saving' ? 'Casting your atlas…' :
          status.kind === 'success' ? '✓ Cast — taking you to your chart' :
          undefined
        }
      />
      <Feedback status={status} onDismissError={() => setStatus({ kind: 'idle' })} />
    </>
  );
}

function Feedback({
  status,
  onDismissError,
}: {
  status: Status;
  onDismissError: () => void;
}) {
  if (status.kind === 'idle') return null;

  const isError = status.kind === 'error';
  const isAuthRequired = status.kind === 'auth-required';

  // Banner sits ABOVE the fold (top-centred), not at the bottom edge,
  // so the user always sees it without scrolling.
  return (
    <div
      role={isError || isAuthRequired ? 'alert' : 'status'}
      style={{
        position: 'fixed',
        top: 84,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        background: 'rgba(8, 12, 24, 0.96)',
        border: `1px solid ${isError ? '#d66' : isAuthRequired ? 'var(--brass)' : 'rgba(200, 160, 82, 0.55)'}`,
        padding: '18px 28px',
        borderRadius: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: isError ? '#f8b6b6' : 'var(--brass, #C8A052)',
        maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {status.kind === 'loading' && 'Loading your account — try again in a moment…'}
      {status.kind === 'saving' && 'Casting your atlas…'}
      {status.kind === 'success' && '✓ Cast — taking you to your chart'}
      {status.kind === 'auth-required' && (
        <>
          <span>Sign in first to save your chart</span>
          <Link
            href="/sign-in?redirect=/onboarding"
            style={{
              padding: '8px 16px',
              border: '1px solid var(--brass)',
              color: 'var(--brass)',
              textDecoration: 'none',
              borderRadius: 4,
              letterSpacing: '0.18em',
            }}
          >
            Sign in
          </Link>
        </>
      )}
      {isError && (
        <>
          <span style={{ textTransform: 'none', letterSpacing: 'normal' }}>
            {status.message}
          </span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss"
            style={{
              background: 'transparent',
              border: 0,
              color: '#f8b6b6',
              cursor: 'pointer',
              padding: 4,
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
