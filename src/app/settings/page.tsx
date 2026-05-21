"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';

type Profile = {
  birth_data: { date?: string; time?: string; place?: string } | null;
  tier: 'free' | 'reader' | 'depth' | 'master' | null;
  first_name: string | null;
} | null;

const TIER_LABEL: Record<string, string> = {
  free: 'The Two',
  reader: 'The Five',
  depth: 'The Seven',
  master: 'The Nine',
};

export default function SettingsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent('/settings'));
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <main className="settings-shell">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const email = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
    ?? user?.emailAddresses[0]?.emailAddress
    ?? '—';
  const tier = profile?.tier ?? 'free';
  const tierLabel = TIER_LABEL[tier] ?? 'The Two';
  const birth = profile?.birth_data;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) {
        alert('Could not clear data. Try again or contact hello@getsynastra.com.');
        setDeleting(false);
        return;
      }
      router.push('/onboarding');
    } catch {
      alert('Network error. Try again or contact hello@getsynastra.com.');
      setDeleting(false);
    }
  };

  const handleManageBilling = async () => {
    if (tier === 'free') {
      router.push('/pricing');
      return;
    }
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!res.ok) {
        // Portal not yet configured — fall through to email.
        window.location.href = 'mailto:hello@getsynastra.com?subject=Manage%20Synastra%20subscription';
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      window.location.href = 'mailto:hello@getsynastra.com?subject=Manage%20Synastra%20subscription';
    }
  };

  return (
    <main className="settings-shell">
      <style jsx global>{`
        .settings-shell {
          min-height: 100vh;
          background: var(--ink-deep, #060912);
          color: var(--ink, #FCFAF6);
          padding: 64px 24px 96px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .settings-wrap { max-width: 640px; margin: 0 auto; }
        .settings-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; }
        .settings-back { font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--brass, #C8A052); text-decoration: none; }
        .settings-back:hover { opacity: 0.85; }
        .settings-title { font-family: 'Alice', Georgia, serif; font-size: 32px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 8px; color: var(--ink, #FCFAF6); }
        .settings-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--brass, #C8A052); margin: 0 0 12px; }
        .settings-section { padding: 28px 0; border-top: 1px solid rgba(252, 250, 246, 0.08); }
        .settings-section:first-of-type { border-top: none; padding-top: 0; }
        .settings-section h2 { font-family: 'Alice', Georgia, serif; font-size: 18px; font-weight: 600; letter-spacing: -0.005em; margin: 0 0 16px; color: var(--ink, #FCFAF6); }
        .settings-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; gap: 24px; }
        .settings-row dt { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(252, 250, 246, 0.55); margin: 0; }
        .settings-row dd { margin: 0; font-size: 14px; color: var(--ink, #FCFAF6); text-align: right; }
        .tier-badge { display: inline-block; padding: 2px 10px; border: 1px solid var(--brass, #C8A052); color: var(--brass, #C8A052); font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; border-radius: 999px; }
        .settings-btn { display: inline-block; padding: 12px 22px; border: 1px solid var(--brass, #C8A052); background: transparent; color: var(--brass, #C8A052); font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; border-radius: 2px; text-decoration: none; transition: all 0.15s ease; }
        .settings-btn:hover { background: rgba(200, 160, 82, 0.08); }
        .settings-btn-primary { background: var(--brass, #C8A052); color: var(--ink-deep, #060912); }
        .settings-btn-primary:hover { background: rgba(232, 220, 184, 1); }
        .settings-btn-danger { border-color: rgba(212, 90, 90, 0.7); color: rgba(232, 130, 130, 1); }
        .settings-btn-danger:hover { background: rgba(212, 90, 90, 0.08); }
        .settings-note { font-size: 13px; line-height: 1.6; color: rgba(252, 250, 246, 0.62); margin: 0 0 16px; }
        .muted { color: rgba(252, 250, 246, 0.5); font-size: 13px; }
        .settings-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
        .danger-zone { border-top: 1px solid rgba(212, 90, 90, 0.25); padding-top: 28px; margin-top: 16px; }
        .danger-zone h2 { color: rgba(232, 130, 130, 1); }
        a.settings-link { color: var(--brass, #C8A052); }
      `}</style>

      <div className="settings-wrap">
        <div className="settings-topbar">
          <Link href="/chart" className="settings-back">← Back to chart</Link>
          <UserButton />
        </div>

        <p className="settings-eyebrow">Synastra · Settings</p>
        <h1 className="settings-title">Your account</h1>

        <section className="settings-section">
          <h2>Account</h2>
          <dl>
            <div className="settings-row">
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
            <div className="settings-row">
              <dt>Tier</dt>
              <dd><span className="tier-badge">{tierLabel}</span></dd>
            </div>
            {profile?.first_name && (
              <div className="settings-row">
                <dt>Name</dt>
                <dd>{profile.first_name}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="settings-section">
          <h2>Birth data</h2>
          {birth?.date ? (
            <dl>
              <div className="settings-row"><dt>Date</dt><dd>{birth.date}</dd></div>
              {birth.time && <div className="settings-row"><dt>Time</dt><dd>{birth.time}</dd></div>}
              {birth.place && <div className="settings-row"><dt>Place</dt><dd>{birth.place}</dd></div>}
            </dl>
          ) : (
            <p className="muted">No birth data on file yet.</p>
          )}
          <div className="settings-actions">
            <Link href="/onboarding" className="settings-btn">Edit birth data</Link>
          </div>
        </section>

        <section className="settings-section">
          <h2>Subscription</h2>
          <p className="settings-note">
            {tier === 'free'
              ? 'You’re on the free tier. Upgrade to read across all seven traditions.'
              : `You’re subscribed to ${tierLabel}.`}
          </p>
          <div className="settings-actions">
            {tier === 'free' ? (
              <Link href="/pricing" className="settings-btn settings-btn-primary">See plans</Link>
            ) : (
              <button type="button" onClick={handleManageBilling} className="settings-btn">
                Manage billing
              </button>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h2>Email preferences</h2>
          <p className="settings-note">
            Synastra only sends transactional and account emails — no marketing. To opt out of any
            future digest or transit alert, email <a className="settings-link" href="mailto:hello@getsynastra.com?subject=Unsubscribe">hello@getsynastra.com</a>.
          </p>
        </section>

        <section className="settings-section danger-zone">
          <h2>Danger zone</h2>
          <p className="settings-note">
            Clearing your data deletes your birth chart, quiz results, and saved readings. This
            cannot be undone. Your sign-in is kept so you can start fresh.
          </p>
          {confirmDelete ? (
            <div className="settings-actions">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="settings-btn settings-btn-danger"
              >
                {deleting ? 'Clearing…' : 'Yes, clear everything'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="settings-btn"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="settings-actions">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="settings-btn settings-btn-danger"
              >
                Clear saved data
              </button>
            </div>
          )}
        </section>

        <div style={{ marginTop: 64, fontSize: 12, color: 'rgba(252,250,246,0.4)', textAlign: 'center' }}>
          <Link href="/privacy" className="settings-link" style={{ marginRight: 16 }}>Privacy</Link>
          <Link href="/terms" className="settings-link">Terms</Link>
        </div>
      </div>
    </main>
  );
}
