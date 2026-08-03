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

export type BureauxPaymentSecretResult =
  | { ok: true; clientSecret: string }
  | {
      ok: false;
      error: 'signInRequired' | 'alreadyActive' | 'config' | 'createFailed';
      detail?: string;
    };

/** Reuse one open session; expire the rest so we never hit Stripe's open-session cap. */
async function reuseOrClearOpenSessions(
  customerId: string
): Promise<string | null> {
  const stripe = getStripe();
  const open = await stripe.checkout.sessions.list({
    customer: customerId,
    status: 'open',
    limit: 20,
  });

  const usable = open.data.filter(
    (s) =>
      s.mode === 'subscription' &&
      (s.ui_mode === 'elements' || s.ui_mode === 'custom') &&
      Boolean(s.client_secret)
  );

  const keep = usable[0] || null;
  await Promise.all(
    open.data
      .filter((s) => s.id !== keep?.id)
      .map((s) =>
        stripe.checkout.sessions.expire(s.id).catch((err) => {
          console.error('expire checkout session failed:', s.id, err);
        })
      )
  );

  return keep?.client_secret || null;
}

async function clearIncompleteSubscriptions(customerId: string, userId: string) {
  const stripe = getStripe();
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: 'incomplete',
    limit: 10,
  });
  await Promise.all(
    list.data.map((sub) =>
      stripe.subscriptions.cancel(sub.id).catch((err) => {
        console.error('cancel incomplete sub failed:', sub.id, err);
      })
    )
  );

  const db = createServiceClient();
  await db
    .from('bureaux_memberships')
    .update({
      status: 'none',
      stripe_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
    })
    .eq('user_id', userId)
    .eq('status', 'incomplete');
}

/**
 * Checkout Session (ui_mode elements) — Payment Element inside Fjorr chrome.
 * Call on Join click — not on every page view.
 */
export async function createBureauxPaymentSecret(): Promise<BureauxPaymentSecretResult> {
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
    await clearIncompleteSubscriptions(customerId, user.id);

    const reused = await reuseOrClearOpenSessions(customerId);
    if (reused) {
      return { ok: true, clientSecret: reused };
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'elements',
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      line_items: [{ price: getBureauxPriceId(), quantity: 1 }],
      payment_method_types: ['card'],
      return_url: appUrl(
        '/bureaux?joined=1&session_id={CHECKOUT_SESSION_ID}'
      ),
    });

    if (!session.client_secret) {
      return {
        ok: false,
        error: 'createFailed',
        detail: 'Checkout Session missing client secret.',
      };
    }

    return { ok: true, clientSecret: session.client_secret };
  } catch (err) {
    const detail =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unknown error';
    console.error('createBureauxPaymentSecret failed:', err);
    return { ok: false, error: 'createFailed', detail };
  }
}

export type BureauxManageResult =
  | { ok: true }
  | { ok: false; error: string };

/** Cancel at period end — access continues until renew date. */
export async function cancelBureauxAtPeriodEnd(): Promise<BureauxManageResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'signInRequired' };

  const membership = await getOwnBureauxMembership(user.id);
  if (!membership?.stripe_subscription_id || !isBureauxMembershipActive(membership)) {
    return { ok: false, error: 'notActive' };
  }

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.update(
      membership.stripe_subscription_id,
      { cancel_at_period_end: true }
    );
    const periodEnd =
      (sub as { current_period_end?: number }).current_period_end ||
      sub.items?.data?.[0]?.current_period_end;
    const db = createServiceClient();
    await db
      .from('bureaux_memberships')
      .update({
        cancel_at_period_end: true,
        status: sub.status === 'active' ? 'active' : membership.status,
        current_period_end:
          typeof periodEnd === 'number' && periodEnd > 0
            ? new Date(periodEnd * 1000).toISOString()
            : membership.current_period_end,
      })
      .eq('user_id', user.id);
    return { ok: true };
  } catch (err) {
    console.error('cancelBureauxAtPeriodEnd failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'cancelFailed',
    };
  }
}

/** Undo cancel-at-period-end while still in the paid window. */
export async function resumeBureauxSubscription(): Promise<BureauxManageResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'signInRequired' };

  const membership = await getOwnBureauxMembership(user.id);
  if (!membership?.stripe_subscription_id) {
    return { ok: false, error: 'notActive' };
  }

  try {
    const stripe = getStripe();
    await stripe.subscriptions.update(membership.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
    const db = createServiceClient();
    await db
      .from('bureaux_memberships')
      .update({ cancel_at_period_end: false })
      .eq('user_id', user.id);
    return { ok: true };
  } catch (err) {
    console.error('resumeBureauxSubscription failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'resumeFailed',
    };
  }
}

/** SetupIntent client secret to update the card on file. */
export async function createBureauxSetupSecret(): Promise<
  | { ok: true; clientSecret: string; email: string | null }
  | { ok: false; error: string }
> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'signInRequired' };

  const membership = await getOwnBureauxMembership(user.id);
  if (!membership?.stripe_customer_id || !isBureauxMembershipActive(membership)) {
    return { ok: false, error: 'notActive' };
  }

  try {
    const stripe = getStripe();
    const setup = await stripe.setupIntents.create({
      customer: membership.stripe_customer_id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { supabase_user_id: user.id },
    });
    if (!setup.client_secret) {
      return { ok: false, error: 'No setup client secret' };
    }
    return {
      ok: true,
      clientSecret: setup.client_secret,
      email: user.email || null,
    };
  } catch (err) {
    console.error('createBureauxSetupSecret failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'setupFailed',
    };
  }
}

export type BureauxCardOnFile = {
  brand: string;
  last4: string;
};

function formatCardBrand(brand: string): string {
  const key = brand.trim().toLowerCase();
  const labels: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'Amex',
    american_express: 'Amex',
    discover: 'Discover',
    diners: 'Diners',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };
  if (labels[key]) return labels[key];
  if (!key) return 'Card';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Default card on file for the member’s Bureaux subscription (display only). */
export async function getOwnBureauxCardOnFile(
  membership: Awaited<ReturnType<typeof getOwnBureauxMembership>>
): Promise<BureauxCardOnFile | null> {
  if (
    !membership?.stripe_customer_id ||
    membership.comp_lifetime ||
    !isBureauxMembershipActive(membership)
  ) {
    return null;
  }

  try {
    const stripe = getStripe();
    let pmId: string | null = null;

    if (membership.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(
        membership.stripe_subscription_id
      );
      const dpm = sub.default_payment_method;
      pmId = typeof dpm === 'string' ? dpm : dpm?.id || null;
    }

    if (!pmId) {
      const customer = await stripe.customers.retrieve(
        membership.stripe_customer_id
      );
      if (!customer.deleted) {
        const dpm = customer.invoice_settings?.default_payment_method;
        pmId = typeof dpm === 'string' ? dpm : dpm?.id || null;
      }
    }

    if (!pmId) {
      const list = await stripe.paymentMethods.list({
        customer: membership.stripe_customer_id,
        type: 'card',
        limit: 1,
      });
      pmId = list.data[0]?.id || null;
    }

    if (!pmId) return null;

    const pm = await stripe.paymentMethods.retrieve(pmId);
    if (pm.type !== 'card' || !pm.card?.last4) return null;

    return {
      brand: formatCardBrand(pm.card.brand || 'card'),
      last4: pm.card.last4,
    };
  } catch (err) {
    console.error('getOwnBureauxCardOnFile failed:', err);
    return null;
  }
}

/** Keep Stripe receipts aligned after a confirmed email change. */
export async function syncStripeCustomerEmail(
  userId: string,
  email: string
): Promise<void> {
  const next = email.trim().toLowerCase();
  if (!next) return;
  const membership = await getOwnBureauxMembership(userId);
  if (!membership?.stripe_customer_id) return;
  try {
    const stripe = getStripe();
    await stripe.customers.update(membership.stripe_customer_id, {
      email: next,
    });
  } catch (err) {
    console.error('syncStripeCustomerEmail failed:', err);
  }
}

/** After SetupIntent succeeds, attach card as subscription default. */
export async function setBureauxDefaultPaymentMethod(
  paymentMethodId: string
): Promise<BureauxManageResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'signInRequired' };

  const membership = await getOwnBureauxMembership(user.id);
  if (
    !membership?.stripe_customer_id ||
    !membership.stripe_subscription_id ||
    !paymentMethodId
  ) {
    return { ok: false, error: 'notActive' };
  }

  try {
    const stripe = getStripe();
    await stripe.customers.update(membership.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    await stripe.subscriptions.update(membership.stripe_subscription_id, {
      default_payment_method: paymentMethodId,
    });
    return { ok: true };
  } catch (err) {
    console.error('setBureauxDefaultPaymentMethod failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'updateFailed',
    };
  }
}

/** @deprecated Prefer on-site BureauxManage — kept as escape hatch. */
export async function startBureauxPortal(): Promise<void> {
  const user = await requireUser();
  if (!user) {
    redirect(`/signin?next=${encodeURIComponent('/bureaux')}`);
  }

  const membership = await getOwnBureauxMembership(user.id);
  let customerId = membership?.stripe_customer_id;
  if (!customerId) {
    customerId = await ensureStripeCustomer(user);
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: appUrl('/bureaux'),
  });

  redirect(portal.url);
}
