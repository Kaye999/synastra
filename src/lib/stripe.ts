// Stripe server client + product id map. Values are placeholder — real IDs
// come from env vars populated once products are created in the Stripe dashboard.

import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY || '';

export const stripe = secret
  ? new Stripe(secret, { apiVersion: '2026-03-25.dahlia' })
  : null;

export type Tier = 'reader' | 'depth';
export type Cadence = 'monthly' | 'onetime';

export const STRIPE_PRICE_IDS: Record<Tier, Record<Cadence, string>> = {
  reader: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_READER_MONTHLY || '',
    onetime: process.env.NEXT_PUBLIC_STRIPE_READER_ONETIME || '',
  },
  depth: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_DEPTH_MONTHLY || '',
    onetime: process.env.NEXT_PUBLIC_STRIPE_DEPTH_ONETIME || '',
  },
};
