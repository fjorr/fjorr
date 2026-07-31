import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export type BureauxStatus =
  | 'none'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid';

export type BureauxMembership = {
  user_id: string;
  status: BureauxStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

/** Active subscription, past_due grace, or canceled but still in paid period. */
export function isBureauxActive(
  status: BureauxStatus | string | null | undefined,
  currentPeriodEnd?: string | null
) {
  if (status === 'active' || status === 'past_due') return true;
  if (status === 'canceled' && currentPeriodEnd) {
    return new Date(currentPeriodEnd).getTime() > Date.now();
  }
  return false;
}

export function isBureauxMembershipActive(
  membership: Pick<BureauxMembership, 'status' | 'current_period_end'> | null
) {
  if (!membership) return false;
  return isBureauxActive(membership.status, membership.current_period_end);
}

export function bureauxNominationLimits(active: boolean) {
  return active
    ? { maxPerDay: 2, maxOpen: 8 }
    : { maxPerDay: 1, maxOpen: 4 };
}

export function bureauxPlusNoteLimit(active: boolean) {
  return active ? 3 : 1;
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
      'user_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end'
    )
    .eq('user_id', uid)
    .maybeSingle();

  if (error) {
    console.error('getOwnBureauxMembership failed:', error.message);
    return null;
  }
  if (!data) return null;

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
  };
}

export async function isOwnBureauxActive(userId?: string): Promise<boolean> {
  const row = await getOwnBureauxMembership(userId);
  return isBureauxMembershipActive(row);
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
