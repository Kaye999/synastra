"use client";

// SignAtlas.tsx — reusable grid of clickable tiles. Renders the same shape
// for all three of:
//   - Western zodiac (12 signs)
//   - Vedic nakshatras (27 lunar mansions)
//   - Numerology numbers (9 single digits + 3 masters)
//
// Each tile shows a large glyph / number + a short label. Hover lifts the
// brass tint. Click expands the tile inline to show the deeper detail
// (archetype, prose, key fields, famous people).
//
// Tiles the user "owns" (their Sun sign, their Moon nakshatra, their Life
// Path) get a permanent brass glow and a "your placement" ribbon — instant
// anchor so the user feels read first, then can compare against the rest.
//
// Cost rule (locked 2026-05-19): any per-tile AI-generated content sits
// behind a PaywallBlur required="reader". Static data (glyph, dates,
// archetype name, prose drawn from existing tables) is free for everyone.

import { useState, type ReactNode } from 'react';

export type AtlasItem = {
  /** Stable key — e.g., 'Aries', 'Ashwini', '1' */
  id: string;
  /** Big visual: glyph for zodiac, name first letter for nakshatra, the number itself for numerology */
  primary: string;
  /** Tile caption — e.g., 'Aries', 'Ashwini', 'Life Path 1' */
  label: string;
  /** Short hint under the label — e.g., 'Mar 21 — Apr 19', 'Ketu · Horse', 'The Initiator' */
  meta?: string;
  /** Whether this is one of the user's own placements */
  isUser?: boolean;
  /** What kind of placement — 'Sun', 'Moon', 'Rising', 'Life Path' etc. */
  userKind?: string;
  /** Detail content rendered when expanded */
  detail: ReactNode;
};

export type SignAtlasProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  items: AtlasItem[];
  /** Grid columns at desktop width. Mobile auto-collapses. */
  columns?: number;
  /** Tile aspect — 'tall' (zodiac/numerology) or 'square' (nakshatra) */
  tileShape?: 'tall' | 'square';
};

export default function SignAtlas({
  eyebrow,
  title,
  intro,
  items,
  columns = 4,
  tileShape = 'tall',
}: SignAtlasProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section style={{ maxWidth: 1080, margin: '0 auto 72px' }}>
      <header style={{ textAlign: 'center', marginBottom: 36 }}>
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
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.2,
            margin: '0 0 14px',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
        {intro && (
          <p
            style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 16,
              lineHeight: 1.7,
              color: 'rgba(252, 250, 246, 0.78)',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            {intro}
          </p>
        )}
      </header>

      <div
        className="sign-atlas-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        {items.map((item) => {
          const isOpen = expanded === item.id;
          return (
            <SignAtlasTile
              key={item.id}
              item={item}
              isOpen={isOpen}
              onToggle={() => setExpanded(isOpen ? null : item.id)}
              tileShape={tileShape}
            />
          );
        })}
      </div>

      {/* Inline detail panel — slides in below the grid showing the
         currently-expanded item's prose. Keeps focus on a single tile
         at a time without forcing a full-page modal. */}
      {expanded && (() => {
        const item = items.find((x) => x.id === expanded);
        if (!item) return null;
        return (
          <div
            role="region"
            aria-label={`${item.label} detail`}
            style={{
              marginTop: 24,
              padding: '32px 36px',
              background: 'rgba(8, 12, 24, 0.62)',
              border: '1px solid rgba(200, 160, 82, 0.22)',
              borderRadius: 6,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded(null)}
              aria-label="Close detail"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'transparent',
                border: 0,
                color: 'rgba(252, 250, 246, 0.55)',
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 14,
                padding: 6,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            {item.detail}
          </div>
        );
      })()}

      <style>{`
        @media (max-width: 720px) {
          .sign-atlas-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ─── Tile ─────────────────────────────────────────────────────────────── */

function SignAtlasTile({
  item,
  isOpen,
  onToggle,
  tileShape,
}: {
  item: AtlasItem;
  isOpen: boolean;
  onToggle: () => void;
  tileShape: 'tall' | 'square';
}) {
  const BRASS = 'var(--brass, #C8A052)';
  const isUser = !!item.isUser;

  const tileStyle: React.CSSProperties = {
    position: 'relative',
    aspectRatio: tileShape === 'tall' ? '3 / 4' : '1 / 1',
    background: isUser
      ? 'rgba(200, 160, 82, 0.10)'
      : isOpen
        ? 'rgba(200, 160, 82, 0.05)'
        : 'rgba(252, 250, 246, 0.02)',
    border: `1px solid ${
      isUser
        ? BRASS
        : isOpen
          ? 'rgba(200, 160, 82, 0.45)'
          : 'rgba(252, 250, 246, 0.08)'
    }`,
    borderRadius: 4,
    padding: 12,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.18s ease, background 0.18s ease, transform 0.12s ease',
    overflow: 'hidden',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={`atlas-detail-${item.id}`}
      style={{ ...tileStyle, fontFamily: 'inherit', color: 'inherit', textAlign: 'center' }}
      onMouseEnter={(e) => {
        if (!isUser && !isOpen) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(252, 250, 246, 0.28)';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(252, 250, 246, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isUser && !isOpen) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(252, 250, 246, 0.08)';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(252, 250, 246, 0.02)';
        }
      }}
    >
      {isUser && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: BRASS,
            padding: '2px 6px',
            border: `1px solid ${BRASS}`,
            borderRadius: 2,
            lineHeight: 1,
          }}
        >
          {item.userKind || 'You'}
        </span>
      )}

      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: tileShape === 'tall' ? 44 : 36,
          lineHeight: 1,
          color: isUser ? BRASS : 'var(--ink)',
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        {item.primary}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: isUser ? 'var(--ink)' : 'rgba(252, 250, 246, 0.72)',
          marginBottom: 4,
          lineHeight: 1.3,
        }}
      >
        {item.label}
      </div>
      {item.meta && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.10em',
            color: 'rgba(252, 250, 246, 0.45)',
            lineHeight: 1.3,
          }}
        >
          {item.meta}
        </div>
      )}
    </button>
  );
}
