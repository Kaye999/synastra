"use client";

// Ornament — shared SVG decorations for editorial dividers.
//
// Three kinds:
//   - asterism     → three-dot typographic mark (filigree)
//   - constellation → five-star constellation fragment with thin connective lines
//   - rule         → hairline with centered sigil (brass-colored)
//
// Stroke/fill use currentColor so callers can tint via CSS colour.

import type { CSSProperties } from 'react';

export type OrnamentKind = 'asterism' | 'constellation' | 'rule';

export type OrnamentProps = {
  kind: OrnamentKind;
  width?: number | string;
  style?: CSSProperties;
  ariaLabel?: string;
};

export default function Ornament({ kind, width, style, ariaLabel }: OrnamentProps) {
  const commonProps = {
    role: 'presentation',
    'aria-label': ariaLabel,
    style: {
      display: 'block',
      margin: '0 auto',
      color: 'var(--brass)',
      opacity: 0.85,
      ...style,
    } as CSSProperties,
  };

  if (kind === 'asterism') {
    return (
      <svg
        {...commonProps}
        width={width ?? 56}
        height={20}
        viewBox="0 0 56 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Three small hand-drawn diamond dots with thin ascenders */}
        <g stroke="currentColor" strokeLinecap="round" strokeWidth="0.9" fill="currentColor">
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="28" cy="6" r="1.6" />
          <circle cx="44" cy="12" r="1.6" />
          <path d="M12 4 v4 M28 14 v3 M44 4 v4" fill="none" opacity="0.55" />
          <path d="M6 12 h2 M20 12 h2 M34 12 h2 M48 12 h2" fill="none" opacity="0.4" />
        </g>
      </svg>
    );
  }

  if (kind === 'constellation') {
    return (
      <svg
        {...commonProps}
        width={width ?? 120}
        height={32}
        viewBox="0 0 120 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 5-star constellation fragment, hairline connectors */}
        <g stroke="currentColor" strokeWidth="0.6" opacity="0.5">
          <line x1="10" y1="22" x2="34" y2="10" />
          <line x1="34" y1="10" x2="60" y2="20" />
          <line x1="60" y1="20" x2="88" y2="8" />
          <line x1="88" y1="8" x2="110" y2="18" />
        </g>
        <g fill="currentColor">
          <circle cx="10" cy="22" r="1.4" />
          <circle cx="34" cy="10" r="1.8" />
          <circle cx="60" cy="20" r="2.2" />
          <circle cx="88" cy="8" r="1.8" />
          <circle cx="110" cy="18" r="1.4" />
        </g>
        <g stroke="currentColor" strokeWidth="0.4" opacity="0.35">
          <path d="M60 14 l0 -3 M60 26 l0 3 M54 20 l-3 0 M66 20 l3 0" />
        </g>
      </svg>
    );
  }

  // rule — hairline with centered sigil
  return (
    <svg
      {...commonProps}
      width={width ?? 220}
      height={16}
      viewBox="0 0 220 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="0" y1="8" x2="90" y2="8" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      <line x1="130" y1="8" x2="220" y2="8" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      {/* centered sigil: a small six-petal rose (stylised hexagram) */}
      <g transform="translate(110 8)" stroke="currentColor" strokeWidth="0.7" fill="none">
        <circle r="3.5" />
        <path d="M0 -5 L0 5 M-4.3 -2.5 L4.3 2.5 M-4.3 2.5 L4.3 -2.5" opacity="0.8" />
      </g>
    </svg>
  );
}
