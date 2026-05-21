"use client";

// Pricing page — editorial three-tier layout with cadence toggle,
// "Why Depth?" editorial note, and a 6-question FAQ accordion.

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import Starfield from '@/components/Starfield';
import Ornament from '@/components/Ornament';
import Reveal from '../_marketing/Reveal';

type Cadence = 'monthly' | 'onetime';
type PaidTier = 'reader' | 'depth' | 'master';

type TierDef =
  | {
      id: 'glance';
      name: string;
      tagline: string;
      price: Record<Cadence, string>;
      savingsPercent: number | null;
      features: string[];
      cta: { label: string; href: string; kind: 'link' };
    }
  | {
      id: PaidTier;
      name: string;
      tagline: string;
      price: Record<Cadence, string>;
      savingsPercent: number | null;
      featured?: boolean;
      features: string[];
      cta: { label: string; kind: 'checkout'; tier: PaidTier };
    };

const TIERS: TierDef[] = [
  {
    id: 'glance',
    name: 'The Two',
    tagline: 'Start with the classics — no card.',
    price: { monthly: 'Free', onetime: 'Free' },
    savingsPercent: null,
    features: [
      'Western astrology — Sun, Moon & Rising preview',
      'Numerology — Life Path number (preview)',
      'Full natal chart + starfield view',
      'Daily planet · daily affirmation · weekly aspect',
      'Keep your chart forever',
    ],
    cta: { label: 'Start free →', href: '/sign-up', kind: 'link' },
  },
  {
    id: 'reader',
    name: 'The Five',
    tagline: 'Five traditions, fully unlocked.',
    price: { monthly: 'A$11.10 / mo', onetime: 'A$77.70 / year' },
    savingsPercent: 42, // ((11.10*12 - 77.70) / (11.10*12))
    features: [
      '§ Everything in The Two',
      'Full Western chart — houses, aspects, personal planets',
      'Full Vedic — nakshatras, pada, current mahadasha',
      'Full Numerology — Expression, Soul Urge, Personal Year',
      'Kabbalah — Hebrew letters, sefirot, tarot paths',
      'Human Design — type, strategy, authority, BodyGraph',
      'Daily Guidance (AI-written each morning)',
      'Monthly Forecast (5-section arc)',
      '10 Oracle AI questions / day',
      'Cancel anytime · readings export as PDF',
    ],
    cta: { label: 'Start reading →', kind: 'checkout', tier: 'reader' },
  },
  {
    id: 'depth',
    name: 'The Seven',
    tagline: 'All seven. Cross-woven.',
    price: { monthly: 'A$22.20 / mo', onetime: 'A$155.40 / year' },
    savingsPercent: 42, // ((22.20*12 - 155.40) / (22.20*12))
    featured: true,
    features: [
      '§ Everything in The Five',
      'Tarot — daily card + three-card + celtic cross',
      'Astrocartography — planetary lines across the earth',
      'Transit Alerts — email on major aspects',
      'Compatibility (full synastry) for any two charts',
      'Wealth & Career Timing — electional windows',
      'Cross-Tradition Synthesis essays',
      'Unlimited Master Oracle — trained across all 7 traditions plus general astrology, astronomy, and the traditional archetypes',
    ],
    cta: { label: 'Go deep →', kind: 'checkout', tier: 'depth' },
  },
  {
    id: 'master',
    name: 'The Nine',
    tagline: 'Nine sacred practices. The full ritual year.',
    price: { monthly: 'A$33.30 / mo', onetime: 'A$233.10 / year' },
    savingsPercent: 42, // ((33.30*12 - 233.10) / (33.30*12))
    features: [
      '§ Everything in The Seven',
      'Personalised for your Sun · Moon · Rising trinity',
      'Monthly Zodiac Season Workbook (printable PDF)',
      'Guided meditation audios — 2 per month',
      'New Moon & Full Moon guided ceremonies',
      'Printable Moon journals — track your cycles',
      'First access to new traditions as they ship',
    ],
    cta: { label: 'Step in →', kind: 'checkout', tier: 'master' },
  },
];

const FAQS = [
  {
    q: 'What is actually different from a horoscope app?',
    a: 'A horoscope reads your Sun sign against today\'s sky. Synastra reads your entire chart across seven independent systems, cross-references where they agree, and writes a daily passage personal to the moment you were born. The Master Oracle answers in your voice, citing your placements.',
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
    a: 'Every Oracle answer is generated with your full chart in context — placements, aspects, nakshatras, Human Design type, numerology, the lot. Answers cite the specific placement they\'re drawing from, so you can verify the reasoning yourself.',
  },
  {
    q: 'Can I read someone else\'s chart?',
    a: 'Yes — The Seven includes full compatibility (synastry). You can generate a chart for any person and run the same seven-tradition reading, then overlay it on yours. Excellent for partners, business, family dynamics.',
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
  const { isSignedIn } = useAuth();

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
              Four readings.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p
              className="mk-hero-sub"
              style={{ margin: '10px auto 0', textAlign: 'center', maxWidth: '42ch' }}
            >
              One glance. One full reading. One that crosses all seven. One that turns the year into a practice.
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
            const isFeatured = 'featured' in tier && tier.featured;
            const showSavings = cadence === 'onetime' && tier.savingsPercent !== null;
            return (
              <Reveal key={tier.id} delay={120 + i * 100}>
                <article
                  id={
                    tier.id === 'reader' ? 'the-five'
                    : tier.id === 'depth' ? 'the-seven'
                    : tier.id === 'master' ? 'the-nine'
                    : 'the-two'
                  }
                  style={{
                    position: 'relative',
                    border: isFeatured ? '1px solid var(--brass)' : '1px solid var(--rule)',
                    padding: '44px 36px',
                    background: isFeatured ? 'rgba(200, 160, 82, 0.04)' : 'rgba(19, 24, 40, 0.45)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {isFeatured && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -11,
                        left: 28,
                        background: 'var(--brass)',
                        color: 'var(--bg-base)',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        padding: '4px 12px',
                        fontWeight: 500,
                      }}
                    >
                      Most chosen
                    </div>
                  )}
                  <h2 className="mk-pricing-tier-name">{tier.name}</h2>
                  <p className="mk-pricing-tier-tag">{tier.tagline}</p>
                  <div className="mk-pricing-tier-price">{tier.price[cadence]}</div>
                  {showSavings && (
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--brass)',
                        marginTop: -8,
                        marginBottom: 24,
                      }}
                    >
                      § Save {tier.savingsPercent}% vs monthly
                    </div>
                  )}
                  {cadence === 'monthly' && tier.savingsPercent !== null && (
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-faint)',
                        marginTop: -8,
                        marginBottom: 24,
                      }}
                    >
                      annual available · save {tier.savingsPercent}%
                    </div>
                  )}
                  <ul className="mk-feat-list" style={{ flexGrow: 1 }}>
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {cta.kind === 'link' ? (
                    <Link
                      href={isSignedIn ? '/chart' : cta.href}
                      className="mk-cta-primary"
                      style={{ textAlign: 'center' }}
                    >
                      {isSignedIn ? 'Open your chart →' : cta.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="mk-cta-primary"
                      disabled={loadingTier !== null}
                      onClick={() => startCheckout(cta.tier, cadence)}
                      style={{
                        textAlign: 'center',
                        opacity: loadingTier !== null ? 0.6 : 1,
                        ...(isFeatured ? { background: 'var(--brass)', color: 'var(--bg-base)' } : {}),
                      }}
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
              Why go deeper?
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
              The Five gives you full Western, Vedic, Numerology, Kabbalah and Human Design —
              the core five traditions read in depth with Daily Guidance and a Monthly arc. The Seven
              adds Tarot and Astrocartography on top, then opens the live layer: transit alerts,
              compatibility, wealth timing, and the Master Oracle — unlimited, trained across all
              seven traditions plus general astrology, astronomy, and the traditional archetypes.
              The Nine turns the year into a practice — every zodiac season arrives with a printable
              workbook, two guided meditation audios, and New / Full Moon ceremonies you can move
              through alone or with others. Monthly is right when you want the sky watched for you.
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

        {/* Footer nav — proper buttons, no more tiny text */}
        <div
          style={{
            marginTop: 80,
            paddingTop: 40,
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" className="mk-page-nav-btn">← Home</Link>
          <Link href="/how-it-works" className="mk-page-nav-btn mk-page-nav-btn-primary">How it works →</Link>
        </div>
      </div>
    </main>
  );
}
