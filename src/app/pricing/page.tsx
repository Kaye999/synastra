"use client";

import { useState } from 'react';
import Link from 'next/link';
import Starfield from '@/components/Starfield';

type Cadence = 'monthly' | 'onetime';
type PaidTier = 'reader' | 'depth';

type TierDef =
  | {
      id: 'glance';
      name: string;
      tagline: string;
      price: Record<Cadence, string>;
      features: string[];
      cta: { label: string; href: string; kind: 'link' };
    }
  | {
      id: PaidTier;
      name: string;
      tagline: string;
      price: Record<Cadence, string>;
      features: string[];
      cta: { label: string; kind: 'checkout'; tier: PaidTier };
    };

const TIERS: TierDef[] = [
  {
    id: 'glance',
    name: 'The Glance',
    tagline: 'See the shape of you',
    price: { monthly: '$0', onetime: '$0' },
    features: ['Sun sign essence', 'Life Path number', 'Chinese zodiac animal'],
    cta: { label: 'Start free', href: '/sign-up', kind: 'link' },
  },
  {
    id: 'reader',
    name: 'The Reading',
    tagline: 'Read the whole chart',
    price: { monthly: '$9 AUD/mo', onetime: '$49 once' },
    features: [
      'Full Western chart',
      'Numerology atlas',
      'Chinese BaZi pillars',
      '10 AI questions/day',
    ],
    cta: { label: 'Start reading', kind: 'checkout', tier: 'reader' },
  },
  {
    id: 'depth',
    name: 'The Depth',
    tagline: 'Unlock every tradition',
    price: { monthly: '$19 AUD/mo', onetime: '$99 once' },
    features: [
      'Everything in The Reading',
      'Vedic sidereal chart + dashas',
      'Kabbalah: Tree of Life',
      'Unlimited AI questions',
      'PDF export',
    ],
    cta: { label: 'Go deep', kind: 'checkout', tier: 'depth' },
  },
];

export default function PricingPage() {
  const [cadence, setCadence] = useState<Cadence>('monthly');
  const [loadingTier, setLoadingTier] = useState<PaidTier | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function startCheckout(tier: PaidTier, interval: Cadence) {
    setErrorMsg(null);
    setLoadingTier(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });

      if (res.status === 401) {
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent('/pricing')}`;
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Unable to start checkout');
      }
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setErrorMsg(message);
      setLoadingTier(null);
    }
  }

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Starfield />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1040, margin: '0 auto', padding: '100px 24px 120px' }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--brass)',
            marginBottom: 14,
            textAlign: 'center',
          }}
        >
          Pricing
        </div>
        <h1 className="editorial-hero" style={{ textAlign: 'center' }}>
          Three readings.
        </h1>
        <p className="editorial-sub" style={{ textAlign: 'center', margin: '0 auto 36px' }}>
          One glance. One full reading. One that goes to the depth of every tradition.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0,
            marginBottom: 48,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {(['monthly', 'onetime'] as Cadence[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              style={{
                padding: '10px 20px',
                border: '1px solid var(--rule)',
                background: cadence === c ? 'var(--brass)' : 'transparent',
                color: cadence === c ? 'var(--bg-base)' : 'var(--ink-dim)',
                cursor: 'pointer',
              }}
            >
              {c === 'monthly' ? 'Monthly' : 'One-time'}
            </button>
          ))}
        </div>

        {errorMsg ? (
          <div
            role="alert"
            style={{
              maxWidth: 520,
              margin: '0 auto 24px',
              padding: '10px 14px',
              border: '1px solid var(--rule)',
              background: 'rgba(255,80,80,0.08)',
              color: 'var(--ink-dim)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        <div className="pricing-grid">
          {TIERS.map((tier) => {
            const cta = tier.cta;
            return (
              <div key={tier.id} className="pricing-card">
                <div className="eyebrow">{tier.tagline}</div>
                <h2 className="title">{tier.name}</h2>
                <div className="price">{tier.price[cadence]}</div>
                <ul>
                  {tier.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {cta.kind === 'link' ? (
                  <Link href={cta.href} className="cta">
                    {cta.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="cta"
                    disabled={loadingTier !== null}
                    onClick={() => startCheckout(cta.tier, cadence)}
                  >
                    {loadingTier === cta.tier ? 'Loading…' : cta.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
