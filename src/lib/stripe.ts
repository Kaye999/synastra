// Stripe server client + product id map. Values come from env vars populated
// once products are created in the Stripe dashboard.
//
// SUPABASE SCHEMA REQUIRED:
// create schema if not exists astral;
// create table astral.profiles (
//   user_id text primary key,
//   tier text not null default 'free' check (tier in ('free','reader','depth')),
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

export type Tier = 'reader' | 'depth';
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
  | 'depth_onetime';

export const TIERS: Record<TierKey, TierConfig> = {
  reader_monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_READER_MONTHLY || '',
    mode: 'subscription',
    tier: 'reader',
    interval: 'monthly',
  },
  reader_onetime: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_READER_ONETIME || '',
    mode: 'payment',
    tier: 'reader',
    interval: 'onetime',
  },
  depth_monthly: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_DEPTH_MONTHLY || '',
    mode: 'subscription',
    tier: 'depth',
    interval: 'monthly',
  },
  depth_onetime: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_DEPTH_ONETIME || '',
    mode: 'payment',
    tier: 'depth',
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
};
