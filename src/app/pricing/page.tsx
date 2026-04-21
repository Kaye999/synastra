"use client";

import { useState } from 'react';
import Link from 'next/link';
import Starfield from '@/components/Starfield';

type Cadence = 'monthly' | 'onetime';

const TIERS = [
  {
    id: 'glance',
    name: 'The Glance',
    tagline: 'See the shape of you',
    price: { monthly: '$0', onetime: '$0' },
    features: ['Sun sign essence', 'Life Path number', 'Chinese zodiac animal'],
    cta: { label: 'Start free', href: '/sign-up' },
  },
  {
    id: 'reading',
    name: 'The Reading',
    tagline: 'Read the whole chart',
    price: { monthly: '$9 AUD/mo', onetime: '$49 once' },
    features: [
      'Full Western chart',
      'Numerology atlas',
      'Chinese BaZi pillars',
      '10 AI questions/day',
    ],
    cta: {
      label: 'Start reading',
      href: { monthly: '/api/stripe/checkout?tier=reader&cadence=monthly', onetime: '/api/stripe/checkout?tier=reader&cadence=onetime' },
    },
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
    cta: {
      label: 'Go deep',
      href: { monthly: '/api/stripe/checkout?tier=depth&cadence=monthly', onetime: '/api/stripe/checkout?tier=depth&cadence=onetime' },
    },
  },
];

export default function PricingPage() {
  const [cadence, setCadence] = useState<Cadence>('monthly');

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

        <div className="pricing-grid">
          {TIERS.map((tier) => {
            const href =
              typeof tier.cta.href === 'string'
                ? tier.cta.href
                : tier.cta.href[cadence];
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
                <Link href={href} className="cta">
                  {tier.cta.label}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
