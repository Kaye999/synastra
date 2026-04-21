// Tier definitions, access helpers, and editorial copy for paywall overlays.
//
// Synastra has three tiers:
//   - free   → landing glimpse (sun sign + one-line teasers)
//   - reader → Western + Numerology + BaZi long readings ($9/mo)
//   - depth  → everything, including Vedic + Kabbalah ($19/mo)
//
// `canAccess` is the single source of truth. Higher tiers satisfy lower
// tier requirements (a `depth` user passes `required: 'reader'` checks).
//
// TIER_COPY provides the editorial overlay text rendered by <PaywallBlur>
// when the user doesn't yet have access.

/*
  SUPABASE RLS (add to dashboard):
    alter table astral.profiles enable row level security;
    create policy "own profile read" on astral.profiles for select using (auth.uid()::text = user_id);
    create policy "own profile insert" on astral.profiles for insert with check (auth.uid()::text = user_id);
    create policy "own profile update" on astral.profiles for update using (auth.uid()::text = user_id);
    -- service role bypasses RLS for the Stripe webhook
*/

// NOTE — expected wiring inside Dashboard.tsx (already in place at time of
// writing; re-verify if the Dashboard agent edits it):
//   <PaywallBlur tier={tier} required="reader"> ... Western  ... </PaywallBlur>
//   <PaywallBlur tier={tier} required="reader"> ... Numerology ... </PaywallBlur>
//   <PaywallBlur tier={tier} required="reader"> ... BaZi     ... </PaywallBlur>
//   <PaywallBlur tier={tier} required="depth">  ... Vedic    ... </PaywallBlur>
//   <PaywallBlur tier={tier} required="depth">  ... Kabbalah ... </PaywallBlur>

export type Tier = 'free' | 'reader' | 'depth';

export const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  reader: 1,
  depth: 2,
};

export function canAccess(userTier: Tier, required: Tier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[required];
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
    headline: 'The First Glimpse',
    bullets: [
      'Sun sign essence',
      'Life path number, at a glance',
      'Year pillar animal',
    ],
    ctaLabel: 'Create your chart',
    ctaHref: '/onboarding',
    priceNote: 'Free · no card required',
    fineprint: 'Five traditions, one birth — the atlas begins.',
  },
  reader: {
    headline: 'Unlock The Reading',
    bullets: [
      'Full Western chart with houses and transits',
      'Numerology — Life Path, Expression, Soul Urge, Personal Year',
      'Chinese BaZi — four pillars, day master, Nine Star Ki',
      'AI-guided chat with your chart',
    ],
    ctaLabel: 'Upgrade — $9/mo',
    ctaHref: '/pricing#reader',
    priceNote: 'Monthly · cancel anytime',
    fineprint: 'One price. Three traditions. Read for you.',
  },
  depth: {
    headline: 'Unlock The Depth',
    bullets: [
      'Everything in Reader',
      'Vedic sidereal chart, nakshatras, mahadasha',
      'Kabbalistic paths — letters, Sefirot, Tarot arcana',
      'Full cross-tradition synthesis essays',
    ],
    ctaLabel: 'Upgrade — $19/mo',
    ctaHref: '/pricing#depth',
    priceNote: 'Monthly · cancel anytime',
    fineprint: 'The full atlas — where East, West, and Tree meet.',
  },
};
