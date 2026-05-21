// /api/stripe/checkout — creates a Stripe Checkout Session for the current
// Clerk user and returns the redirect URL.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe, TIERS, tierKey, type Cadence, type Tier } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isTier(value: string | null | undefined): value is Tier {
  return value === 'reader' || value === 'depth' || value === 'master';
}

function isCadence(value: string | null | undefined): value is Cadence {
  return value === 'monthly' || value === 'onetime';
}

async function createSession(tier: Tier, interval: Cadence) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = TIERS[tierKey(tier, interval)];
  if (!config || !config.priceId) {
    return NextResponse.json(
      { error: `Missing price ID for ${tier}/${interval}` },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  const session = await stripe.checkout.sessions.create({
    mode: config.mode,
    line_items: [{ price: config.priceId, quantity: 1 }],
    customer_email: email,
    client_reference_id: userId,
    metadata: { userId, tier, interval },
    // Subscriptions also honour metadata on the subscription record so the
    // webhook has what it needs when customer.subscription.* events fire.
    ...(config.mode === 'subscription'
      ? { subscription_data: { metadata: { userId, tier, interval } } }
      : {}),
    success_url: `${appUrl}/chart?upgraded=1`,
    cancel_url: `${appUrl}/pricing`,
  });

  return { session };
}

export async function POST(request: NextRequest) {
  let body: { tier?: string; interval?: string } = {};
  try {
    body = await request.json();
  } catch {
    // fall through — validation below will catch missing fields
  }

  if (!isTier(body.tier) || !isCadence(body.interval)) {
    return NextResponse.json(
      { error: 'Expected {tier: "reader"|"depth"|"master", interval: "monthly"|"onetime"}' },
      { status: 400 },
    );
  }

  const result = await createSession(body.tier, body.interval);
  if (result instanceof NextResponse) return result;

  return NextResponse.json({ url: result.session.url, sessionId: result.session.id });
}

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get('tier');
  const interval = request.nextUrl.searchParams.get('interval');

  if (!isTier(tier) || !isCadence(interval)) {
    return NextResponse.json(
      { error: 'Expected ?tier=reader|depth|master&interval=monthly|onetime' },
      { status: 400 },
    );
  }

  const result = await createSession(tier, interval);
  if (result instanceof NextResponse) return result;

  if (!result.session.url) {
    return NextResponse.json({ error: 'Stripe returned no redirect URL' }, { status: 500 });
  }

  // Direct link from the pricing page → redirect to Stripe.
  return NextResponse.redirect(result.session.url, { status: 303 });
}
