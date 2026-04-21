"use client";

// PaywallBlur — gates premium content behind a blurred preview + editorial
// upgrade card. If the user's tier satisfies `required`, children render
// cleanly. Otherwise, children are blurred and a brass-bordered CTA card
// overlays the center.
//
// Backwards compatibility: earlier Dashboard wiring passes pipe-separated
// requirements like `required="reader|depth"`. We accept both `Tier` and
// that string form, collapsing the list to its lowest tier (the easiest
// threshold to satisfy).

import type { ReactNode } from 'react';
import { canAccess, TIER_COPY, TIER_ORDER, type Tier } from '@/lib/tiers';

export type PaywallBlurProps = {
  tier: Tier;
  required: Tier | string;
  children: ReactNode;
  teaser?: string;
};

const VALID: readonly Tier[] = ['free', 'reader', 'depth'];

function isTier(value: string): value is Tier {
  return (VALID as readonly string[]).includes(value);
}

function normaliseRequired(required: Tier | string): Tier {
  // Pipe-separated list: pick the lowest tier (the easiest gate to satisfy).
  if (typeof required === 'string' && required.includes('|')) {
    const parsed = required
      .split('|')
      .map((t) => t.trim().toLowerCase())
      .filter(isTier);
    if (parsed.length === 0) return 'reader';
    return parsed.reduce((lowest, t) =>
      TIER_ORDER[t] < TIER_ORDER[lowest] ? t : lowest,
    );
  }
  const single = String(required).trim().toLowerCase();
  if (isTier(single)) return single;
  return 'reader';
}

export default function PaywallBlur({ tier, required, children, teaser }: PaywallBlurProps) {
  const needed = normaliseRequired(required);

  if (canAccess(tier, needed)) {
    return <>{children}</>;
  }

  const copy = TIER_COPY[needed];

  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        marginBottom: 32,
      }}
    >
      {/* Blurred content underneath — non-interactive */}
      <div
        aria-hidden="true"
        style={{
          filter: 'blur(8px)',
          WebkitFilter: 'blur(8px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.55,
        }}
      >
        {children}
      </div>

      {/* Overlay card — sibling, absolutely centered */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 2,
        }}
      >
        <div
          role="group"
          aria-label={copy.headline}
          style={{
            maxWidth: 460,
            width: '100%',
            background: 'rgba(12, 10, 14, 0.92)',
            border: '1px solid var(--brass, #C8A052)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
            padding: '32px 28px',
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {teaser && (
            <p
              style={{
                fontFamily: "'Crimson Pro', 'Crimson Text', serif",
                fontSize: 15,
                fontStyle: 'italic',
                lineHeight: 1.5,
                color: 'var(--ink-faint, #A89878)',
                margin: '0 0 18px',
              }}
            >
              “{teaser}”
            </p>
          )}

          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--brass, #C8A052)',
              marginBottom: 12,
            }}
          >
            Synastra · Locked
          </div>

          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              margin: '0 0 18px',
              color: 'var(--ink, #ECE4D2)',
            }}
          >
            {copy.headline}
          </h2>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 24px',
              fontFamily: "'Crimson Pro', 'Crimson Text', serif",
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--ink, #ECE4D2)',
              textAlign: 'left',
              display: 'inline-block',
            }}
          >
            {copy.bullets.map((b) => (
              <li
                key={b}
                style={{
                  position: 'relative',
                  paddingLeft: 18,
                  marginBottom: 6,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    color: 'var(--brass, #C8A052)',
                  }}
                >
                  ·
                </span>
                {b}
              </li>
            ))}
          </ul>

          <a
            href={copy.ctaHref}
            style={{
              display: 'inline-block',
              padding: '12px 26px',
              border: '1px solid var(--brass, #C8A052)',
              color: 'var(--brass, #C8A052)',
              textDecoration: 'none',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            {copy.ctaLabel}
          </a>

          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint, #A89878)',
              marginTop: 4,
            }}
          >
            {copy.priceNote}
          </div>
          <div
            style={{
              fontFamily: "'Crimson Pro', 'Crimson Text', serif",
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ink-faint, #A89878)',
              marginTop: 10,
            }}
          >
            {copy.fineprint}
          </div>
        </div>
      </div>
    </div>
  );
}
