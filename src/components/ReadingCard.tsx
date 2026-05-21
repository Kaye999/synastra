"use client";

// ReadingCard — generic editorial wrapper for any reading surface.
//
// Style: Alice title, Plex Mono tracking-wide eyebrow, hairline divider,
// Hanken Grotesk body. Hover applies a gentle brass halo (pulse-halo). Supports
// loading shimmer and error states without mounting/unmounting (avoids layout
// pop when readings stream in).

import type { ReactNode } from 'react';
import Ornament from './Ornament';
import { DISCLAIMER } from '@/lib/disclaimer';

export type ReadingCardProps = {
  title: string;
  eyebrow?: string;
  body?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  footer?: ReactNode;
  dense?: boolean;
};

export default function ReadingCard({
  title,
  eyebrow,
  body,
  isLoading,
  error,
  onRefresh,
  footer,
  dense,
}: ReadingCardProps) {
  return (
    <article
      className="reading-card"
      style={{
        position: 'relative',
        border: '1px solid var(--rule)',
        background: 'var(--mist)',
        padding: dense ? '24px 26px' : '34px 34px 30px',
        borderRadius: 2,
        transition: 'border-color 320ms ease, box-shadow 600ms ease',
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--brass)',
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
      )}

      <h3
        style={{
          fontFamily: "'Alice', serif",
          fontVariationSettings: '"opsz" 144',
          fontSize: dense ? 24 : 30,
          fontWeight: 500,
          letterSpacing: '-0.014em',
          lineHeight: 1.08,
          margin: '0 0 14px',
          color: 'var(--ink)',
        }}
      >
        {title}
      </h3>

      <hr
        style={{
          width: 36,
          height: 1,
          background: 'var(--brass)',
          border: 0,
          margin: '0 0 18px',
          opacity: 0.7,
        }}
      />

      {error && !isLoading && (
        <div>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', serif",
              fontStyle: 'italic',
              color: 'var(--ember)',
              margin: '0 0 14px',
              fontSize: 15,
            }}
          >
            {error}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              style={{
                background: 'transparent',
                border: '1px solid var(--brass)',
                color: 'var(--brass)',
                padding: '8px 16px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {isLoading && !error && <ConstellationShimmer />}

      {!isLoading && !error && body && (
        <div
          style={{
            fontFamily: "'Hanken Grotesk', serif",
            fontSize: 18,
            lineHeight: 1.68,
            color: 'var(--ink-dim)',
          }}
        >
          {body}
        </div>
      )}

      {footer && (
        <div
          style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid var(--rule)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          {footer}
        </div>
      )}

      {body && !isLoading && !error && (
        <p
          style={{
            marginTop: footer ? 12 : 22,
            marginBottom: 0,
            paddingTop: footer ? 0 : 16,
            borderTop: footer ? undefined : '1px solid var(--rule)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            lineHeight: 1.7,
            letterSpacing: '0.03em',
            color: 'var(--ink-faint)',
          }}
        >
          {DISCLAIMER}
        </p>
      )}
    </article>
  );
}

// ─── Shimmer placeholder ─────────────────────────────────────────────────────
function ConstellationShimmer() {
  return (
    <div aria-live="polite" aria-busy="true" style={{ padding: '4px 0' }}>
      <div style={{ marginBottom: 22 }}>
        <Ornament kind="constellation" width={180} style={{ margin: 0, opacity: 0.5 }} />
      </div>
      {[88, 72, 94, 60].map((w, i) => (
        <div
          key={i}
          className="shimmer-line"
          style={{
            height: 14,
            width: `${w}%`,
            marginBottom: 12,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
