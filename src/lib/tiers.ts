// Tier definitions, access helpers, and editorial copy for paywall overlays.
//
// Synastra has four tiers (2026-05-21 — added The Nine + repriced 2026-05-18 collapse):
//   - free   → The Two:   preview of Western + Numerology
//   - reader → The Five:  full Western + Numerology + Vedic + Kabbalah + Human Design.
//                         Daily, Monthly, 10 Oracle AI questions/day.
//   - depth  → The Seven: full all 7 traditions + Tarot + Astrocartography.
//                         Unlimited Master Oracle (trained across all 7 traditions
//                         + general astrology + astronomy + traditional archetypes),
//                         transit alerts, compatibility, cross-tradition synthesis.
//   - master → The Nine:  everything in The Seven + two monthly rituals — guided
//                         meditation audios, Zodiac Season Workbook PDF, printable
//                         Moon journals, explicit Sun · Moon · Rising personalization.
//
// Internal tier IDs (free/reader/depth/master) intentionally NOT renamed — they
// back the DB column and Stripe env var names. Renaming them is a coordinated
// migration tracked separately.
//
// Traditions removed in this collapse (engines kept on disk for optionality):
// BaZi (Chinese), Mayan Tzolk'in, Enneagram, Gene Keys, Ayurveda.
//
// `canAccess` gates by tier rank. `canAccessTradition` gates by per-tradition
// minimum tier using TRADITION_MIN_TIER as the single source of truth.

export type Tier = 'free' | 'reader' | 'depth' | 'master';

export const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  reader: 1,
  depth: 2,
  master: 3,
};

export function canAccess(userTier: Tier, required: Tier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[required];
}

export type Tradition =
  | 'western'
  | 'numerology'
  | 'vedic'
  | 'kabbalah'
  | 'humanDesign'
  | 'tarot'
  | 'astrocartography';

// Per-tradition minimum tier.
export const TRADITION_MIN_TIER: Record<Tradition, Tier> = {
  // The Two — free preview
  western: 'free',
  numerology: 'free',
  // The Five — adds three deeper systems
  vedic: 'reader',
  kabbalah: 'reader',
  humanDesign: 'reader',
  // The Seven — adds the esoteric two + unlocks the Master Oracle
  tarot: 'depth',
  astrocartography: 'depth',
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
    headline: 'The Two',
    bullets: [
      'Western astrology — Sun, Moon & Rising essence',
      'Numerology — Life Path at a glance',
    ],
    ctaLabel: 'Create your chart',
    ctaHref: '/onboarding',
    priceNote: 'Free · no card required',
    fineprint: 'A first look — two traditions, one birth, the atlas begins.',
  },
  reader: {
    headline: 'Unlock The Five',
    bullets: [
      'Full Western & Numerology readings',
      'Vedic — Lagna, Nakshatra, mahadasha',
      'Kabbalah — letters, sefirot, paths',
      'Human Design — type, strategy, authority',
      'Daily Guidance + Monthly Forecast',
      '10 Oracle AI questions every day',
    ],
    ctaLabel: 'Upgrade — A$19/mo',
    ctaHref: '/pricing#reader',
    priceNote: 'Monthly · cancel anytime',
    fineprint: 'Cross the threshold — five traditions, fully unlocked.',
  },
  depth: {
    headline: 'Unlock The Seven',
    bullets: [
      'Everything in The Five',
      'Tarot — daily card + full spreads',
      'Astrocartography — your planetary geography',
      'Transit alerts + Compatibility',
      'Cross-tradition synthesis essays',
      'Unlimited Master Oracle — trained across all 7 traditions, general astrology, astronomy & traditional archetypes',
    ],
    ctaLabel: 'Upgrade — A$22.20/mo',
    ctaHref: '/pricing#depth',
    priceNote: 'Monthly · cancel anytime',
    fineprint: 'Seven traditions. One chart. One Oracle.',
  },
  master: {
    headline: 'Unlock The Nine',
    bullets: [
      'Everything in The Seven',
      'Personalised for your Sun · Moon · Rising trinity',
      'Monthly Zodiac Season Workbook (printable PDF)',
      'Guided meditation audios — 2 per month',
      'New Moon & Full Moon guided ceremonies',
      'Printable Moon journals — track your cycles',
    ],
    ctaLabel: 'Upgrade — A$33.30/mo',
    ctaHref: '/pricing#master',
    priceNote: 'Monthly · cancel anytime',
    fineprint: 'Nine sacred practices. The full ritual year.',
  },
};
