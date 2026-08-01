import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getBureauxPriceId, getStripe } from '@/lib/stripe';
import { isBureauxMembershipActive, type BureauxMembership } from '@/lib/bureaux';

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

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

async function membershipForUser(
  userId: string
): Promise<BureauxMembership | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('bureaux_memberships')
    .select(
      'user_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, bureaux_number'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  const n = Number(data.bureaux_number);
  return {
    user_id: String(data.user_id),
    status: (data.status || 'none') as BureauxMembership['status'],
    stripe_customer_id: data.stripe_customer_id
      ? String(data.stripe_customer_id)
      : null,
    stripe_subscription_id: data.stripe_subscription_id
      ? String(data.stripe_subscription_id)
      : null,
    current_period_end: data.current_period_end
      ? String(data.current_period_end)
      : null,
    cancel_at_period_end: Boolean(data.cancel_at_period_end),
    bureaux_number: Number.isFinite(n) && n >= 1 ? n : null,
  };
}

/** Create or resolve auth user for Bureaux join (works with public signups off). */
async function ensureAuthUserForEmail(
  email: string
): Promise<{ id: string; email: string }> {
  const admin = createServiceClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { join_via: 'bureaux' },
  });

  if (created?.user?.id) {
    return { id: created.user.id, email };
  }

  if (error && /already|registered|exists/i.test(error.message)) {
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });
    if (linkData?.user?.id) {
      return { id: linkData.user.id, email };
    }
    throw linkErr || error;
  }

  throw error || new Error('Could not create account');
}

async function ensureStripeCustomer(user: {
  id: string;
  email?: string | null;
}): Promise<string> {
  const existing = await membershipForUser(user.id);
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
 * Signed-in: uses session user.
 * Guest: body `{ email }` creates/resolves auth user, then same checkout.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    let body: { email?: string } = {};
    try {
      body = (await req.json()) as { email?: string };
    } catch {
      body = {};
    }

    let userId: string;
    let email: string | null;

    if (sessionUser) {
      userId = sessionUser.id;
      email = sessionUser.email?.toLowerCase() || normalizeEmail(body.email);
      if (!email) {
        return NextResponse.json(
          { ok: false, error: 'emailRequired', detail: 'Account email missing.' },
          { status: 400 }
        );
      }
    } else {
      const guestEmail = normalizeEmail(body.email);
      if (!guestEmail) {
        return NextResponse.json(
          { ok: false, error: 'emailRequired' },
          { status: 400 }
        );
      }
      const ensured = await ensureAuthUserForEmail(guestEmail);
      userId = ensured.id;
      email = ensured.email;
    }

    const membership = await membershipForUser(userId);
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
    const customerId = await ensureStripeCustomer({ id: userId, email });

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
      metadata: { supabase_user_id: userId },
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
        user_id: userId,
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
      email,
      signedIn: Boolean(sessionUser),
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
