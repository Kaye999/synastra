// Stripe server client + product id map. Values come from env vars populated
// once products are created in the Stripe dashboard.
//
// SUPABASE SCHEMA REQUIRED:
// create schema if not exists astral;
// create table astral.profiles (
//   user_id text primary key,
//   tier text not null default 'free' check (tier in ('free','reader','depth','master')),
//   stripe_customer_id text,
//   stripe_subscription_id text,
//   birth_data jsonb,
//   chat_quota_used_today int default 0,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now()
// );
// create index on astral.profiles (stripe_customer_id);

import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY || '';

// Pin to the dahlia API version so generated types match runtime behaviour.
export const stripe = secret
  ? new Stripe(secret, { apiVersion: '2026-03-25.dahlia' })
  : null;

// Paid tiers only — `free` is not purchaseable. The full Tier type lives in
// `@/lib/tiers` and includes 'free'.
export type Tier = 'reader' | 'depth' | 'master';
export type Cadence = 'monthly' | 'onetime';
export type CheckoutMode = 'subscription' | 'payment';

export type TierConfig = {
  priceId: string;
  mode: CheckoutMode;
  tier: Tier;
  interval: Cadence;
};

export type TierKey =
  | 'reader_monthly'
  | 'reader_onetime'
  | 'depth_monthly'
  | 'depth_onetime'
  | 'master_monthly'
  | 'master_onetime';

// Hard-coded fallback price IDs (live mode). Vercel env vars override these
// at runtime; the fallbacks keep Stripe checkout working if an env var lags
// behind a re-price. NEXT_PUBLIC_* values are non-secret by definition.
const FALLBACK_PRICE_IDS = {
  reader_monthly: 'price_1TZUsu2EI3wlD7djHDuLeEqR', // A$11.10/mo
  reader_onetime: 'price_1TZUsv2EI3wlD7djukNPgUla', // A$77.70 one-time / year
  depth_monthly: 'price_1TZUsw2EI3wlD7djGFp374AK', // A$22.20/mo
  depth_onetime: 'price_1TZUsx2EI3wlD7djiQlsLPvq', // A$155.40 one-time / year
  master_monthly: 'price_1TZUt62EI3wlD7djDPZ0BioG', // A$33.30/mo
  master_onetime: 'price_1TZUt82EI3wlD7djFNxGfqLO', // A$233.10 one-time / year
} as const;

export const TIERS: Record<TierKey, TierConfig> = {
  reader_monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_READER_MONTHLY || FALLBACK_PRICE_IDS.reader_monthly,
    mode: 'subscription',
    tier: 'reader',
    interval: 'monthly',
  },
  reader_onetime: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_READER_ONETIME || FALLBACK_PRICE_IDS.reader_onetime,
    mode: 'payment',
    tier: 'reader',
    interval: 'onetime',
  },
  depth_monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_DEPTH_MONTHLY || FALLBACK_PRICE_IDS.depth_monthly,
    mode: 'subscription',
    tier: 'depth',
    interval: 'monthly',
  },
  depth_onetime: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_DEPTH_ONETIME || FALLBACK_PRICE_IDS.depth_onetime,
    mode: 'payment',
    tier: 'depth',
    interval: 'onetime',
  },
  master_monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_MASTER_MONTHLY || FALLBACK_PRICE_IDS.master_monthly,
    mode: 'subscription',
    tier: 'master',
    interval: 'monthly',
  },
  master_onetime: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_MASTER_ONETIME || FALLBACK_PRICE_IDS.master_onetime,
    mode: 'payment',
    tier: 'master',
    interval: 'onetime',
  },
};

export function tierKey(tier: Tier, interval: Cadence): TierKey {
  return `${tier}_${interval}` as TierKey;
}

// Retained for backwards-compat with anything that imported the old shape.
export const STRIPE_PRICE_IDS: Record<Tier, Record<Cadence, string>> = {
  reader: {
    monthly: TIERS.reader_monthly.priceId,
    onetime: TIERS.reader_onetime.priceId,
  },
  depth: {
    monthly: TIERS.depth_monthly.priceId,
    onetime: TIERS.depth_onetime.priceId,
  },
  master: {
    monthly: TIERS.master_monthly.priceId,
    onetime: TIERS.master_onetime.priceId,
  },
};
