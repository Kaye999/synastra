"use client";

// CollapsibleHero — full-width dropdown shell for editorial daily/monthly tiles.
// Header is always visible: eyebrow date, serif title, italic tease, +/− toggle.
// Click anywhere on the header to expand/collapse the body.

import type { ReactNode } from 'react';

export type CollapsibleHeroProps = {
  eyebrow: string;
  title: string;
  tease: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function CollapsibleHero({
  eyebrow,
  title,
  tease,
  open,
  onToggle,
  children,
}: CollapsibleHeroProps) {
  return (
    <section
      style={{
        border: '1px solid rgba(200, 160, 82, 0.18)',
        background: 'rgba(12, 10, 14, 0.55)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          width: '100%',
          padding: '28px 36px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.24em',
              color: 'var(--brass, #C8A052)',
              marginBottom: 10,
            }}
          >
            {eyebrow}
          </div>
          <h2
            style={{
              fontFamily: "'Alice', serif",
              fontSize: 'clamp(28px, 4.2vw, 44px)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'var(--ink, #ECE4D2)',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', 'Crimson Text', serif",
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--ink-faint, #A89878)',
              margin: '10px 0 0',
            }}
          >
            {tease}
          </p>
        </div>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 22,
            color: 'var(--brass, #C8A052)',
            transition: 'transform 240ms ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            lineHeight: 1,
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '8px 36px 40px',
            borderTop: '1px solid rgba(200, 160, 82, 0.10)',
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
