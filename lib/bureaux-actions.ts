'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { appUrl } from '@/lib/site';
import { getBureauxPriceId, getStripe } from '@/lib/stripe';
import {
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

/** Ensure a Stripe customer exists and is stored on the membership row. */
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

  if (error) {
    console.error('ensureStripeCustomer upsert failed:', error.message);
    throw new Error('Could not start checkout.');
  }

  return customer.id;
}

export type BureauxCheckoutSecretResult =
  | { ok: true; clientSecret: string }
  | { ok: false; error: 'signInRequired' | 'alreadyActive' | 'config' | 'createFailed' };

/**
 * Create an Embedded Checkout Session and return its client secret.
 * Mount with Stripe EmbeddedCheckout on-site — no redirect to Stripe.
 */
export async function createBureauxCheckoutClientSecret(): Promise<BureauxCheckoutSecretResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'signInRequired' };

  const membership = await getOwnBureauxMembership(user.id);
  if (isBureauxMembershipActive(membership)) {
    return { ok: false, error: 'alreadyActive' };
  }

  try {
    getBureauxPriceId();
  } catch {
    return { ok: false, error: 'config' };
  }

  try {
    const customerId = await ensureStripeCustomer(user);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      line_items: [{ price: getBureauxPriceId(), quantity: 1 }],
      return_url: appUrl(
        '/account/bureaux?joined=1&session_id={CHECKOUT_SESSION_ID}'
      ),
      allow_promotion_codes: true,
    });

    if (!session.client_secret) {
      return { ok: false, error: 'createFailed' };
    }

    return { ok: true, clientSecret: session.client_secret };
  } catch (err) {
    console.error('createBureauxCheckoutClientSecret failed:', err);
    return { ok: false, error: 'createFailed' };
  }
}

/** Open Stripe Customer Portal for manage / cancel. */
export async function startBureauxPortal(): Promise<void> {
  const user = await requireUser();
  if (!user) {
    redirect(`/signin?next=${encodeURIComponent('/account/bureaux')}`);
  }

  const membership = await getOwnBureauxMembership(user.id);
  let customerId = membership?.stripe_customer_id;
  if (!customerId) {
    customerId = await ensureStripeCustomer(user);
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: appUrl('/account/bureaux'),
  });

  redirect(portal.url);
}
