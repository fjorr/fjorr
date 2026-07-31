import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getBureauxPriceId, getStripe } from '@/lib/stripe';
import {
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';

export const runtime = 'nodejs';

function clientSecretFromSubscription(sub: Stripe.Subscription): string | null {
  const invoice = sub.latest_invoice;
  if (!invoice || typeof invoice === 'string') return null;

  const withSecret = invoice as Stripe.Invoice & {
    confirmation_secret?: { client_secret?: string | null } | null;
    payment_intent?: string | Stripe.PaymentIntent | null;
  };

  const fromConfirmation = withSecret.confirmation_secret?.client_secret;
  if (fromConfirmation) return fromConfirmation;

  const pi = withSecret.payment_intent;
  if (pi && typeof pi !== 'string' && pi.client_secret) {
    return pi.client_secret;
  }

  const pending = sub.pending_setup_intent;
  if (pending && typeof pending !== 'string' && pending.client_secret) {
    return pending.client_secret;
  }

  return null;
}

async function ensureStripeCustomer(user: {
  id: string;
  email?: string | null;
}): Promise<string> {
  const existing = await getOwnBureauxMembership(user.id);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email || undefined,
    metadata: { supabase_user_id: user.id },
  });

  const db = createServiceClient();
  const { error } = await db.from('bureaux_memberships').upsert(
    {
      user_id: user.id,
      stripe_customer_id: customer.id,
      status: existing?.status || 'none',
      stripe_subscription_id: existing?.stripe_subscription_id || null,
      current_period_end: existing?.current_period_end || null,
      cancel_at_period_end: existing?.cancel_at_period_end || false,
    },
    { onConflict: 'user_id' }
  );
  if (error) throw new Error(`membership upsert: ${error.message}`);
  return customer.id;
}

/**
 * POST — incomplete subscription + Payment Element client secret.
 * (Classic Elements path — more reliable than Checkout ui_mode=elements locally.)
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'signInRequired' },
        { status: 401 }
      );
    }

    const membership = await getOwnBureauxMembership(user.id);
    if (isBureauxMembershipActive(membership)) {
      return NextResponse.json(
        { ok: false, error: 'alreadyActive' },
        { status: 409 }
      );
    }

    let priceId: string;
    try {
      priceId = getBureauxPriceId();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'config', detail: 'Missing STRIPE_BUREAUX_PRICE_ID' },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(user);

    // Expire abandoned Checkout Sessions from earlier experiments.
    const open = await stripe.checkout.sessions.list({
      customer: customerId,
      status: 'open',
      limit: 100,
    });
    await Promise.all(
      open.data.map((s) =>
        stripe.checkout.sessions.expire(s.id).catch(() => null)
      )
    );

    // Cancel stuck incomplete subscriptions, then create a fresh one.
    const incomplete = await stripe.subscriptions.list({
      customer: customerId,
      status: 'incomplete',
      limit: 10,
    });
    await Promise.all(
      incomplete.data.map((sub) =>
        stripe.subscriptions.cancel(sub.id).catch(() => null)
      )
    );

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId, quantity: 1 }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      metadata: { supabase_user_id: user.id },
      expand: [
        'latest_invoice.confirmation_secret',
        'latest_invoice.payment_intent',
        'pending_setup_intent',
      ],
    });

    const clientSecret = clientSecretFromSubscription(subscription);
    if (!clientSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: 'createFailed',
          detail: `No client secret on subscription ${subscription.id} (${subscription.status})`,
        },
        { status: 500 }
      );
    }

    const db = createServiceClient();
    await db.from('bureaux_memberships').upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: 'incomplete',
        cancel_at_period_end: false,
      },
      { onConflict: 'user_id' }
    );

    return NextResponse.json({
      ok: true,
      clientSecret,
      email: user.email || null,
      mode: 'payment_element',
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('POST /api/stripe/bureaux-checkout failed:', err);
    return NextResponse.json(
      { ok: false, error: 'createFailed', detail },
      { status: 500 }
    );
  }
}
