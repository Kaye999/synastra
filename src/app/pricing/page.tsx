"use client";

// Pricing page — editorial three-tier layout with cadence toggle,
// "Why Depth?" editorial note, and a 6-question FAQ accordion.

import { useState } from 'react';
import Link from 'next/link';
import Starfield from '@/components/Starfield';
import Ornament from '@/components/Ornament';
import Reveal from '../_marketing/Reveal';

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
    tagline: 'See the shape of you.',
    price: { monthly: 'Free', onetime: 'Free' },
    features: ['Chart preview', 'Sun sign essence', 'Life Path number', 'Chinese zodiac animal'],
    cta: { label: 'Start free', href: '/sign-up', kind: 'link' },
  },
  {
    id: 'reader',
    name: 'The Reading',
    tagline: 'Read the whole chart.',
    price: { monthly: 'A$19 / mo', onetime: 'A$129 / year' },
    features: [
      'All eight traditions',
      'Daily Guidance',
      'Monthly Forecast',
      'Life Purpose reading',
      'Shadow prompts',
      '10 AI questions / day',
    ],
    cta: { label: 'Start reading', kind: 'checkout', tier: 'reader' },
  },
  {
    id: 'depth',
    name: 'The Depth',
    tagline: 'Unlock every tradition.',
    price: { monthly: 'A$39 / mo', onetime: 'A$259 / year' },
    features: [
      'Everything in The Reading',
      'Compatibility (synastry)',
      'Wealth Timing',
      'Transit Alerts (email)',
      'Unlimited AI questions',
      'PDF export',
    ],
    cta: { label: 'Go deep', kind: 'checkout', tier: 'depth' },
  },
];

const FAQS = [
  {
    q: 'What is actually different from a horoscope app?',
    a: 'A horoscope reads your Sun sign against today\'s sky. Synastra reads your entire chart across eight independent systems, cross-references where they agree, and writes a daily passage personal to the moment you were born. The Oracle answers in your voice, citing your placements.',
  },
  {
    q: 'Monthly or annual — which should I pick?',
    a: 'Monthly keeps everything live — Daily Guidance, Transit Alerts, Oracle chat. Annual is a single payment that unlocks a full year of Synastra at roughly 55% off monthly; billing resets each year from your purchase date.',
  },
  {
    q: 'Do you need my exact birth time?',
    a: 'For full accuracy, yes — an accurate time pins your rising sign and house cusps, which matter a great deal in Western and Vedic systems. If you don\'t know it, we run a solar chart and mark the time-dependent sections as provisional.',
  },
  {
    q: 'How is the AI grounded in my chart?',
    a: 'Every Oracle answer is generated with your full chart in context — placements, aspects, nakshatras, BaZi pillars, Human Design type, numerology, the lot. Answers cite the specific placement they\'re drawing from, so you can verify the reasoning yourself.',
  },
  {
    q: 'Can I read someone else\'s chart?',
    a: 'Yes — The Depth includes full compatibility (synastry). You can generate a chart for any person and run the same eight-tradition reading, then overlay it on yours. Excellent for partners, business, family dynamics.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, and your chart data stays. Cancel from Settings in a click. If you cancel a monthly plan, access continues to the end of the billing period and your readings remain exportable.',
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

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1120,
          margin: '0 auto',
          padding: '120px 24px 120px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 18 }}>§ Pricing</div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mk-section-title" style={{ fontSize: 'clamp(48px, 7vw, 80px)' }}>
              Three readings.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p
              className="mk-hero-sub"
              style={{ margin: '10px auto 0', textAlign: 'center', maxWidth: '42ch' }}
            >
              One glance. One full reading. One that goes to the depth of every tradition.
            </p>
          </Reveal>
        </div>

        {/* Cadence toggle */}
        <Reveal delay={200}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 0,
              marginBottom: 48,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            {(['monthly', 'onetime'] as Cadence[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCadence(c)}
                style={{
                  padding: '12px 26px',
                  border: '1px solid var(--rule)',
                  background: cadence === c ? 'var(--brass)' : 'transparent',
                  color: cadence === c ? 'var(--bg-base)' : 'var(--ink-dim)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  letterSpacing: 'inherit',
                  textTransform: 'inherit',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {c === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>
        </Reveal>

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

        {/* Tier grid (editorial cards) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {TIERS.map((tier, i) => {
            const cta = tier.cta;
            return (
              <Reveal key={tier.id} delay={120 + i * 100}>
                <article
                  style={{
                    border: '1px solid var(--rule)',
                    padding: '44px 36px',
                    background: 'rgba(19, 24, 40, 0.45)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <h2 className="mk-pricing-tier-name">{tier.name}</h2>
                  <p className="mk-pricing-tier-tag">{tier.tagline}</p>
                  <div className="mk-pricing-tier-price">{tier.price[cadence]}</div>
                  <ul className="mk-feat-list" style={{ flexGrow: 1 }}>
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {cta.kind === 'link' ? (
                    <Link href={cta.href} className="mk-cta-primary" style={{ textAlign: 'center' }}>
                      {cta.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="mk-cta-primary"
                      disabled={loadingTier !== null}
                      onClick={() => startCheckout(cta.tier, cadence)}
                      style={{ textAlign: 'center', opacity: loadingTier !== null ? 0.6 : 1 }}
                    >
                      {loadingTier === cta.tier ? 'Loading…' : cta.label}
                    </button>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Why Depth? */}
        <Reveal>
          <div style={{ maxWidth: 720, margin: '100px auto 80px', textAlign: 'center' }}>
            <Ornament kind="rule" width={220} style={{ marginBottom: 28 }} />
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: '0 0 20px',
              }}
            >
              Why Depth?
            </h3>
            <p
              style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: 18,
                lineHeight: 1.65,
                color: 'var(--ink-dim)',
                margin: 0,
              }}
            >
              The Reading gives you a complete chart across every system we support. The Depth adds the
              live layer — Transit Alerts that ping you when the sky moves through your chart, Wealth
              Timing that watches Jupiter and the second house, and compatibility so you can read another
              person alongside yourself. Monthly is right when you want the sky watched for you.
              One-time is right when you want the reading as a keepsake — exported, portable, yours.
            </p>
          </div>
        </Reveal>

        {/* FAQ */}
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <Reveal>
            <div className="mk-eyebrow" style={{ marginBottom: 14, textAlign: 'center' }}>
              § Frequently asked
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: '0 0 36px',
                textAlign: 'center',
              }}
            >
              Questions, answered.
            </h3>
          </Reveal>

          <div className="mk-faq">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={60 + i * 40}>
                <details>
                  <summary>{f.q}</summary>
                  <p className="answer">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div
          style={{
            marginTop: 80,
            paddingTop: 40,
            borderTop: '1px solid var(--rule)',
            textAlign: 'center',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          <Link
            href="/"
            style={{ color: 'var(--ink-faint)', textDecoration: 'none', marginRight: 18 }}
          >
            ← Home
          </Link>
          <Link
            href="/how-it-works"
            style={{ color: 'var(--brass)', textDecoration: 'none' }}
          >
            How it works →
          </Link>
        </div>
      </div>
    </main>
  );
}
