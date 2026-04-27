// Tier definitions, access helpers, and editorial copy for paywall overlays.
//
// Synastra has three tiers (2026-04 refresh):
//   - free   → The Three: preview of Western + Vedic + Numerology
//   - reader → The Six: full Western + Vedic + Numerology + Kabbalah + BaZi
//              + Human Design. Daily, Monthly, 10 AI/day.
//   - depth  → The Nine: full all 12 traditions + Mayan, Astrocartography,
//              Tarot, Enneagram, Gene Keys, Ayurveda. Transit alerts,
//              compatibility, unlimited AI, cross-tradition synthesis.
//
// `canAccess` gates by tier rank. `canAccessTradition` gates by per-tradition
// minimum tier using TRADITION_MIN_TIER as the single source of truth.
//
// TIER_COPY provides the editorial overlay text rendered by <PaywallBlur>
// when the user doesn't yet have access.

export type Tier = 'free' | 'reader' | 'depth';

export const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  reader: 1,
  depth: 2,
};

export function canAccess(userTier: Tier, required: Tier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[required];
}

export type Tradition =
  | 'western'
  | 'vedic'
  | 'numerology'
  | 'kabbalah'
  | 'bazi'
  | 'humanDesign'
  | 'mayan'
  | 'astrocartography'
  | 'tarot'
  | 'enneagram'
  | 'geneKeys'
  | 'ayurveda';

// Per-tradition minimum tier. For free-tier traditions, full content is
// rendered as a *preview* — the <PaywallBlur required="reader"> wrapper
// around the deeper slabs inside each tradition section still gates the
// full reading behind the upgrade.
export const TRADITION_MIN_TIER: Record<Tradition, Tier> = {
  // Free: preview (three biggest-name traditions)
  western: 'free',
  vedic: 'free',
  numerology: 'free',
  // Reader: three more
  kabbalah: 'reader',
  bazi: 'reader',
  humanDesign: 'reader',
  // Depth: the esoteric / advanced cluster
  mayan: 'depth',
  astrocartography: 'depth',
  tarot: 'depth',
  enneagram: 'depth',
  geneKeys: 'depth',
  ayurveda: 'depth',
};

export function canAccessTradition(userTier: Tier, tradition: Tradition): boolean {
  return canAccess(userTier, TRADITION_MIN_TIER[tradition]);
}

export type TierCopy = {
  headline: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  priceNote: string;
  fineprint: string;
};

export const TIER_COPY: Record<Tier, TierCopy> = {
  free: {
    headline: 'The Three',
    bullets: [
      'Western astrology — Sun, Moon & Rising essence',
      'Vedic — Lagna, Nakshatra & day-star preview',
      'Numerology — Life Path at a glance',
    ],
    ctaLabel: 'Create your chart',
    ctaHref: '/onboarding',
    priceNote: 'Free · no card required',
    fineprint: 'Three traditions, one birth — the atlas begins.',
  },
  reader: {
    headline: 'Unlock The Six',
    bullets: [
      'Full Western, Vedic & Numerology readings',
      'Kabbalah — letters, sefirot, paths',
      'Chinese BaZi — four pillars, day master',
      'Human Design — type, strategy, authority',
      'Daily Guidance + Monthly Forecast',
      '10 Oracle AI questions every day',
    ],
    ctaLabel: 'Upgrade — A$19/mo',
    ctaHref: '/pricing#reader',
    priceNote: 'Monthly · cancel anytime',
    fineprint: 'Six traditions, fully unlocked.',
  },
  depth: {
    headline: 'Unlock The Nine',
    bullets: [
      'Everything in The Six',
      'Mayan Tzolk’in, Astrocartography, Tarot',
      'Enneagram, Gene Keys, Ayurveda',
      'Transit alerts + Compatibility + Wealth timing',
      'Cross-tradition synthesis essays',
      'Unlimited Oracle AI',
    ],
    ctaLabel: 'Upgrade — A$39/mo',
    ctaHref: '/pricing#depth',
    priceNote: 'Monthly · cancel anytime',
    fineprint: 'The full atlas — twelve threads, one mirror.',
  },
};
