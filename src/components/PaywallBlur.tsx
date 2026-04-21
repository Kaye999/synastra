"use client";

// PaywallBlur — placeholder gate. Another agent will build the real blur/upsell UI.
// For now: if `tier` is in `allowed`, render children; otherwise render a blurred
// preview with an upsell CTA.

import type { ReactNode } from 'react';
import type { Tier } from '@/lib/types';

export type PaywallBlurProps = {
  tier: Tier;
  // Pipe-separated list: "reader|depth" or a single tier.
  required: string;
  children: ReactNode;
  previewLines?: number;
};

function parseRequired(required: string): Tier[] {
  return required
    .split('|')
    .map((t) => t.trim().toLowerCase() as Tier)
    .filter((t): t is Tier => t === 'free' || t === 'reader' || t === 'depth');
}

export default function PaywallBlur({ tier, required, children, previewLines = 3 }: PaywallBlurProps) {
  const allowed = parseRequired(required);
  if (allowed.includes(tier)) return <>{children}</>;

  // TODO — another agent wires the real blur/upsell. For now: keep content
  // visible but clipped, and render a nudge. When tier === 'free' we still
  // pass through per the brief's interim behaviour.
  if (tier === 'free') {
    return (
      <div className="paywall-preview" style={{ position: 'relative' }}>
        <div
          style={{
            maxHeight: `${previewLines * 1.6}em`,
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          }}
        >
          {children}
        </div>
        <div className="paywall-cta" style={{ marginTop: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brass, #C8A052)' }}>
          <a href="/pricing" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Unlock the full reading →
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
