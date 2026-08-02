import 'server-only';

import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { appUrl } from '@/lib/site';
import { getStripe } from '@/lib/stripe';
import {
  activateGiftMembership,
  ensureAuthUserByEmail,
  getBureauxAnnualAmountCents,
  getBureauxMembershipByUserId,
  getOwnBureauxMembership,
  isBureauxMembershipActive,
} from '@/lib/bureaux';

export type BureauxGift = {
  id: string;
  token: string;
  from_user_id: string;
  to_email: string;
  status: 'pending_payment' | 'open' | 'redeemed' | 'expired' | 'canceled';
  expires_at: string | null;
  redeemed_at: string | null;
  created_at: string;
};

function yearStartIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1)).toISOString();
}

function makeToken() {
  return randomBytes(24).toString('base64url');
}

export async function getGiftByToken(
  token: string
): Promise<BureauxGift | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('bureaux_gifts')
    .select(
      'id, token, from_user_id, to_email, status, expires_at, redeemed_at, created_at'
    )
    .eq('token', token)
    .maybeSingle();
  if (error || !data) return null;
  return data as BureauxGift;
}

/** Quota: at most one open/pending gift, and one redeemed gift this calendar year. */
export async function getOwnGiftSeatState(userId: string): Promise<{
  canGift: boolean;
  openGift: BureauxGift | null;
  redeemedThisYear: number;
  reason: 'ok' | 'notActive' | 'hasOpen' | 'quotaUsed';
}> {
  const membership = await getBureauxMembershipByUserId(userId);
  if (!isBureauxMembershipActive(membership)) {
    return {
      canGift: false,
      openGift: null,
      redeemedThisYear: 0,
      reason: 'notActive',
    };
  }

  const db = createServiceClient();
  const { data: openRows } = await db
    .from('bureaux_gifts')
    .select(
      'id, token, from_user_id, to_email, status, expires_at, redeemed_at, created_at'
    )
    .eq('from_user_id', userId)
    .in('status', ['pending_payment', 'open'])
    .order('created_at', { ascending: false })
    .limit(1);

  const openGift = (openRows?.[0] as BureauxGift | undefined) || null;
  if (openGift) {
    return {
      canGift: false,
      openGift,
      redeemedThisYear: 0,
      reason: 'hasOpen',
    };
  }

  const { count } = await db
    .from('bureaux_gifts')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', userId)
    .eq('status', 'redeemed')
    .gte('redeemed_at', yearStartIso());

  const redeemedThisYear = count || 0;
  if (redeemedThisYear >= 1) {
    return {
      canGift: false,
      openGift: null,
      redeemedThisYear,
      reason: 'quotaUsed',
    };
  }

  return {
    canGift: true,
    openGift: null,
    redeemedThisYear,
    reason: 'ok',
  };
}

/**
 * Start Stripe Checkout (payment) for one gift seat.
 * Only signed-in active Bureaux members; no public codes.
 */
export async function startBureauxGiftCheckout(toEmail: string): Promise<
  | { ok: true; url: string }
  | {
      ok: false;
      error:
        | 'signInRequired'
        | 'notActive'
        | 'emailInvalid'
        | 'hasOpen'
        | 'quotaUsed'
        | 'selfGift'
        | 'createFailed';
      detail?: string;
    }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'signInRequired' };

  const email = toEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'emailInvalid' };
  }
  if (user.email && user.email.trim().toLowerCase() === email) {
    return { ok: false, error: 'selfGift' };
  }

  const seat = await getOwnGiftSeatState(user.id);
  if (!seat.canGift) {
    return {
      ok: false,
      error:
        seat.reason === 'hasOpen'
          ? 'hasOpen'
          : seat.reason === 'quotaUsed'
            ? 'quotaUsed'
            : 'notActive',
    };
  }

  const token = makeToken();
  const db = createServiceClient();
  const { data: gift, error: insertError } = await db
    .from('bureaux_gifts')
    .insert({
      token,
      from_user_id: user.id,
      to_email: email,
      status: 'pending_payment',
    })
    .select('id, token')
    .single();

  if (insertError || !gift) {
    console.error('startBureauxGiftCheckout insert:', insertError?.message);
    return { ok: false, error: 'createFailed', detail: insertError?.message };
  }

  try {
    const stripe = getStripe();
    const amount = getBureauxAnnualAmountCents();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: {
        kind: 'bureaux_gift',
        bureaux_gift_id: gift.id,
        from_user_id: user.id,
        to_email: email,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: 'Bureaux — one seat to pass on',
              description: `Gift one year of The Bureaux to ${email}`,
            },
          },
        },
      ],
      success_url: appUrl(
        `/bureaux?gift=1&session_id={CHECKOUT_SESSION_ID}`
      ),
      cancel_url: appUrl('/bureaux?gift=canceled'),
    });

    if (!session.url) {
      return { ok: false, error: 'createFailed', detail: 'No checkout URL' };
    }

    await db
      .from('bureaux_gifts')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', gift.id);

    return { ok: true, url: session.url };
  } catch (err) {
    await db.from('bureaux_gifts').delete().eq('id', gift.id);
    const detail = err instanceof Error ? err.message : String(err);
    console.error('startBureauxGiftCheckout stripe:', detail);
    return { ok: false, error: 'createFailed', detail };
  }
}

/** Mark gift open after successful payment (webhook or return URL). */
export async function markBureauxGiftPaid(session: {
  id: string;
  metadata?: Record<string, string> | null;
  payment_status?: string | null;
}): Promise<void> {
  if (session.metadata?.kind !== 'bureaux_gift') return;
  if (
    session.payment_status &&
    session.payment_status !== 'paid' &&
    session.payment_status !== 'no_payment_required'
  ) {
    return;
  }
  const giftId = session.metadata.bureaux_gift_id;
  if (!giftId) return;

  const db = createServiceClient();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  await db
    .from('bureaux_gifts')
    .update({
      status: 'open',
      stripe_checkout_session_id: session.id,
      expires_at: expires.toISOString(),
    })
    .eq('id', giftId)
    .in('status', ['pending_payment', 'open']);
}

/** Return-URL sync when webhook is slow (local/dev). */
export async function syncBureauxGiftFromCheckoutSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.kind !== 'bureaux_gift') return;
  if (session.metadata.from_user_id !== userId) return;
  await markBureauxGiftPaid(session);
}

/** Recipient redeems an open gift seat. */
export async function redeemBureauxGift(token: string): Promise<
  | { ok: true }
  | {
      ok: false;
      error:
        | 'signInRequired'
        | 'notFound'
        | 'expired'
        | 'notOpen'
        | 'wrongEmail'
        | 'alreadyActive'
        | 'redeemFailed';
    }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: 'signInRequired' };

  const gift = await getGiftByToken(token);
  if (!gift) return { ok: false, error: 'notFound' };
  if (gift.status === 'redeemed') return { ok: false, error: 'notOpen' };
  if (gift.status !== 'open') return { ok: false, error: 'notOpen' };
  if (gift.expires_at && new Date(gift.expires_at).getTime() < Date.now()) {
    const db = createServiceClient();
    await db
      .from('bureaux_gifts')
      .update({ status: 'expired' })
      .eq('id', gift.id);
    return { ok: false, error: 'expired' };
  }

  const userEmail = user.email.trim().toLowerCase();
  if (userEmail !== gift.to_email.trim().toLowerCase()) {
    return { ok: false, error: 'wrongEmail' };
  }

  try {
    await activateGiftMembership({
      userId: user.id,
      sponsoredByUserId: gift.from_user_id,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'alreadyActive') {
      return { ok: false, error: 'alreadyActive' };
    }
    console.error('redeemBureauxGift:', err);
    return { ok: false, error: 'redeemFailed' };
  }

  const db = createServiceClient();
  await db
    .from('bureaux_gifts')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_by_user_id: user.id,
    })
    .eq('id', gift.id);

  return { ok: true };
}

/** Ensure recipient auth user exists (for redeem sign-in). */
export async function prepareGiftRecipient(token: string) {
  const gift = await getGiftByToken(token);
  if (!gift || gift.status !== 'open') return null;
  await ensureAuthUserByEmail(gift.to_email);
  return gift;
}

export async function requireActiveMemberForGift() {
  const membership = await getOwnBureauxMembership();
  if (!isBureauxMembershipActive(membership)) {
    redirect('/bureaux');
  }
}
