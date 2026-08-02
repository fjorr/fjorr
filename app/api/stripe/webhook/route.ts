import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  findBureauxUserByCustomerId,
  mapStripeSubscriptionStatus,
  upsertBureauxMembership,
} from '@/lib/bureaux';
import { markBureauxGiftPaid } from '@/lib/bureaux-gift';

export const runtime = 'nodejs';

function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  const end = (sub as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (typeof end === 'number' && end > 0) {
    return new Date(end * 1000);
  }
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  if (typeof itemEnd === 'number' && itemEnd > 0) {
    return new Date(itemEnd * 1000);
  }
  return null;
}

async function resolveUserId(params: {
  userId?: string | null;
  customerId?: string | null;
}): Promise<string | null> {
  if (params.userId) return params.userId;
  if (params.customerId) {
    return findBureauxUserByCustomerId(params.customerId);
  }
  return null;
}

async function syncSubscription(
  sub: Stripe.Subscription,
  fallbackUserId?: string | null
) {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  const userId = await resolveUserId({
    userId:
      fallbackUserId ||
      sub.metadata?.supabase_user_id ||
      null,
    customerId: customerId || null,
  });

  if (!userId) {
    console.error('Stripe webhook: no user for subscription', sub.id);
    return;
  }

  const status = mapStripeSubscriptionStatus(sub.status);
  await upsertBureauxMembership({
    userId,
    stripeCustomerId: customerId || null,
    stripeSubscriptionId: sub.id,
    status,
    currentPeriodEnd: periodEndFromSubscription(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 });
  }

  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('Stripe webhook signature failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.mode === 'payment' &&
          session.metadata?.kind === 'bureaux_gift'
        ) {
          await markBureauxGiftPaid(session);
          break;
        }
        if (session.mode !== 'subscription') break;
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(
          sub,
          session.client_reference_id ||
            session.metadata?.supabase_user_id ||
            null
        );
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string } | null;
        };
        const raw = invoice.subscription;
        const subId = typeof raw === 'string' ? raw : raw?.id;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Stripe webhook handler failed:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
