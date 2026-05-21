// /api/stripe/webhook — verifies Stripe signatures and mirrors subscription
// state into Supabase. Runs without auth context (Stripe calls us), so DB
// writes use the SERVICE_ROLE key.

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileUpdate = {
  user_id: string;
  tier?: 'free' | 'reader' | 'depth' | 'master';
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  payment_failed?: boolean;
  updated_at?: string;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'astral' },
  });
}

async function upsertProfile(patch: ProfileUpdate) {
  const db = serviceClient();
  if (!db) {
    console.error('[stripe webhook] Supabase service client not configured');
    return;
  }
  const { error } = await db
    .from('profiles')
    .upsert(
      { ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) {
    console.error('[stripe webhook] upsert failed', error);
  }
}

function tierFromMetadata(metadata: Stripe.Metadata | null | undefined): 'reader' | 'depth' | 'master' | null {
  const raw = metadata?.tier;
  if (raw === 'reader' || raw === 'depth' || raw === 'master') return raw;
  return null;
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  // Raw body is required for signature verification.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[stripe webhook] signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        const tier = tierFromMetadata(session.metadata);

        if (!userId || !tier) {
          console.warn('[stripe webhook] checkout.session.completed missing userId/tier', {
            userId,
            tier,
          });
          break;
        }

        const patch: ProfileUpdate = {
          user_id: userId,
          tier,
          stripe_customer_id:
            typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
        };

        if (session.mode === 'subscription') {
          patch.stripe_subscription_id =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id ?? null;
        }

        await upsertProfile(patch);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const tier = tierFromMetadata(sub.metadata);
        if (!userId) break;

        // Active-ish states keep the paid tier; everything else drops to free.
        const active = ['active', 'trialing', 'past_due'].includes(sub.status);
        await upsertProfile({
          user_id: userId,
          tier: active && tier ? tier : 'free',
          stripe_customer_id:
            typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          stripe_subscription_id: sub.id,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        await upsertProfile({
          user_id: userId,
          tier: 'free',
          stripe_subscription_id: null,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Stripe types the field as string | Stripe.Subscription | null on some
        // API versions; read defensively.
        const invoiceObj = invoice as unknown as { subscription?: string | Stripe.Subscription | null };
        const subRef = invoiceObj.subscription;
        const subId =
          typeof subRef === 'string' ? subRef : subRef?.id;
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await upsertProfile({
          user_id: userId,
          payment_failed: true,
        });
        break;
      }

      default:
        // Unhandled events are fine — we just ACK them.
        break;
    }
  } catch (err) {
    console.error('[stripe webhook] handler threw', err);
    // Still 200 so Stripe doesn't retry forever on handler bugs; logs surface the issue.
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
