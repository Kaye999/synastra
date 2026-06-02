// /meditations — The Nine's library of guided meditation + breathing audios.
// Lower tiers see the editorial pitch and an upgrade CTA. Subscribers see
// the playable library.

import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccess, type Tier } from '@/lib/tiers';
import Starfield from '@/components/Starfield';
import MeditationsClient from '@/components/MeditationsClient';
import BrandHome from '@/components/BrandHome';

export const dynamic = 'force-dynamic';

type ProfileShape = { tier?: Tier; first_name?: string };

export default async function MeditationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/meditations');
  }

  const supabase = await createSupabaseServerClient();
  const profileQ = await (supabase as unknown as {
    schema: (s: string) => { from: (t: string) => { select: (c: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: ProfileShape | null }> } } } };
  })
    .schema('astral')
    .from('profiles')
    .select('tier, first_name')
    .eq('user_id', userId)
    .maybeSingle();

  const tier: Tier = (profileQ.data?.tier ?? 'free') as Tier;
  const firstName = profileQ.data?.first_name || 'you';
  const hasAccess = canAccess(tier, 'master');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />
      <BrandHome />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto', padding: '88px 24px 140px' }}>
        <Link
          href="/chart"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-dim)',
            textDecoration: 'none',
            marginBottom: 24,
            display: 'inline-block',
          }}
        >
          ← Back to chart
        </Link>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--brass)',
            marginBottom: 14,
            marginTop: 8,
          }}
        >
          § The Nine · Practice library
        </div>

        <h1
          style={{
            fontFamily: "'Alice', serif",
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 500,
            lineHeight: 1.1,
            margin: '0 0 18px',
            color: 'var(--ink)',
          }}
        >
          Meditation &amp; breathing
        </h1>

        <p
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 18,
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: 'rgba(252, 250, 246, 0.78)',
            maxWidth: 56,
            margin: '0 0 56px',
            maxInlineSize: '56ch',
          }}
        >
          Two audios a month, paced to the season the sky is in. Land in the body before
          you read the chart — the words mean more when you arrive open.
        </p>

        {hasAccess ? (
          <MeditationsClient firstName={firstName} />
        ) : (
          <UpgradeBlock currentTier={tier} />
        )}
      </div>
    </div>
  );
}

function UpgradeBlock({ currentTier }: { currentTier: Tier }) {
  const isFree = currentTier === 'free';
  return (
    <div
      style={{
        padding: '40px 36px',
        border: '1px solid rgba(200, 160, 82, 0.32)',
        background: 'rgba(8, 12, 24, 0.62)',
        borderRadius: 6,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--brass)',
          marginBottom: 10,
        }}
      >
        The Nine · A$33.30 / mo
      </div>
      <h2
        style={{
          fontFamily: "'Alice', serif",
          fontSize: 28,
          fontWeight: 500,
          margin: '0 0 14px',
          color: 'var(--ink)',
        }}
      >
        The practice library is part of The Nine.
      </h2>
      <p
        style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 16,
          lineHeight: 1.7,
          color: 'rgba(252, 250, 246, 0.78)',
          maxWidth: '60ch',
          margin: '0 0 22px',
        }}
      >
        Two guided meditation and breathing audios per month, the Monthly Zodiac Season
        Workbook (printable PDF), and Moon journals to track your cycles. Everything in
        The Seven, deepened with the rituals.
      </p>
      <Link
        href="/pricing#master"
        style={{
          display: 'inline-block',
          padding: '14px 28px',
          background: 'var(--brass)',
          color: 'var(--bg-base)',
          textDecoration: 'none',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        Step in →
      </Link>
      {isFree && (
        <p
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--ink-faint)',
            marginTop: 18,
          }}
        >
          Already a Five or Seven subscriber? You can upgrade in Settings without losing your reading history.
        </p>
      )}
    </div>
  );
}
