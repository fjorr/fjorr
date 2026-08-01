import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  isBureauxActive,
  isBureauxMembershipActive,
  type BureauxStatus,
} from '@/lib/bureaux-status';

export type { BureauxStatus };
export { isBureauxActive, isBureauxMembershipActive };

export type BureauxMembership = {
  user_id: string;
  status: BureauxStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  /** Random permanent mark — assigned once on activation. */
  bureaux_number: number | null;
};

/** Daily / open caps for Bureaux members (participation is members-only). */
export function bureauxNominationLimits() {
  return { maxPerDay: 2, maxOpen: 8 };
}

/** Notes per film per day for Bureaux members. */
export function bureauxPlusNoteLimit() {
  return 3;
}

/** Display price for UI (cents). Default $48/year until env overrides. */
export function getBureauxAnnualAmountCents(): number {
  const raw = process.env.NEXT_PUBLIC_BUREAUX_ANNUAL_CENTS;
  const n = raw ? Number(raw) : 4800;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 4800;
}

export async function getOwnBureauxMembership(
  userId?: string
): Promise<BureauxMembership | null> {
  const supabase = await createClient();
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    uid = user.id;
  }

  const { data, error } = await supabase
    .from('bureaux_memberships')
    .select(
      'user_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, bureaux_number'
    )
    .eq('user_id', uid)
    .maybeSingle();

  if (error) {
    console.error('getOwnBureauxMembership failed:', error.message);
    return null;
  }
  if (!data) return null;

  const n = Number(data.bureaux_number);

  return {
    user_id: String(data.user_id),
    status: (data.status || 'none') as BureauxStatus,
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

export async function isOwnBureauxActive(userId?: string): Promise<boolean> {
  const row = await getOwnBureauxMembership(userId);
  return isBureauxMembershipActive(row);
}

const BUREAUX_NUMBER_MIN = 10000;
const BUREAUX_NUMBER_MAX = 99999;

/** Random 5-digit mark; never sequential. Retries on unique collision. */
async function allocateBureauxNumber(
  db: ReturnType<typeof createServiceClient>
): Promise<number> {
  for (let attempt = 0; attempt < 24; attempt++) {
    const n =
      BUREAUX_NUMBER_MIN +
      Math.floor(
        Math.random() * (BUREAUX_NUMBER_MAX - BUREAUX_NUMBER_MIN + 1)
      );
    const { data } = await db
      .from('bureaux_memberships')
      .select('user_id')
      .eq('bureaux_number', n)
      .maybeSingle();
    if (!data) return n;
  }
  throw new Error('Could not allocate a unique Bureaux number');
}

/**
 * Ensure an active membership has a permanent bureaux_number.
 * Idempotent — never changes an existing number.
 */
export async function ensureBureauxNumber(userId: string): Promise<number | null> {
  const db = createServiceClient();
  const { data: existing } = await db
    .from('bureaux_memberships')
    .select('bureaux_number, status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) return null;
  const have = Number(existing.bureaux_number);
  if (Number.isFinite(have) && have >= 1) return have;

  if (
    !isBureauxActive(
      existing.status as BureauxStatus,
      existing.current_period_end
        ? String(existing.current_period_end)
        : null
    )
  ) {
    return null;
  }

  const next = await allocateBureauxNumber(db);
  const { error } = await db
    .from('bureaux_memberships')
    .update({ bureaux_number: next })
    .eq('user_id', userId)
    .is('bureaux_number', null);

  if (error) {
    // Race: another writer assigned — re-read.
    const { data: again } = await db
      .from('bureaux_memberships')
      .select('bureaux_number')
      .eq('user_id', userId)
      .maybeSingle();
    const n = Number(again?.bureaux_number);
    return Number.isFinite(n) && n >= 1 ? n : null;
  }

  return next;
}

/** Upsert from Stripe webhook (service role). */
export async function upsertBureauxMembership(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: BureauxStatus;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const db = createServiceClient();
  const { error } = await db.from('bureaux_memberships').upsert(
    {
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      status: input.status,
      current_period_end: input.currentPeriodEnd
        ? input.currentPeriodEnd.toISOString()
        : null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('upsertBureauxMembership failed:', error.message);
    throw error;
  }

  if (isBureauxActive(input.status, input.currentPeriodEnd?.toISOString() ?? null)) {
    await ensureBureauxNumber(input.userId);
  }
}

export async function findBureauxUserByCustomerId(
  customerId: string
): Promise<string | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('bureaux_memberships')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error) {
    console.error('findBureauxUserByCustomerId failed:', error.message);
    return null;
  }
  return data?.user_id ? String(data.user_id) : null;
}

export function mapStripeSubscriptionStatus(
  status: string
): BureauxStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    case 'unpaid':
      return 'unpaid';
    default:
      return 'none';
  }
}
