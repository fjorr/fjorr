import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  isBureauxActive,
  isBureauxMembershipActive,
  type BureauxStatus,
} from '@/lib/bureaux-status';

export type { BureauxStatus };
export { isBureauxActive, isBureauxMembershipActive };

export type BureauxSource = 'stripe' | 'gift' | 'comp';

export type BureauxMembership = {
  user_id: string;
  status: BureauxStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  /** Random permanent mark — assigned once on activation. */
  bureaux_number: number | null;
  source: BureauxSource;
  sponsored_by_user_id: string | null;
  comp_lifetime: boolean;
};

const MEMBERSHIP_SELECT =
  'user_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, bureaux_number, source, sponsored_by_user_id, comp_lifetime';

function mapMembershipRow(data: Record<string, unknown>): BureauxMembership {
  const n = Number(data.bureaux_number);
  const source = String(data.source || 'stripe') as BureauxSource;
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
    source:
      source === 'gift' || source === 'comp' || source === 'stripe'
        ? source
        : 'stripe',
    sponsored_by_user_id: data.sponsored_by_user_id
      ? String(data.sponsored_by_user_id)
      : null,
    comp_lifetime: Boolean(data.comp_lifetime),
  };
}

/** Daily / open caps for Bureaux members (participation is members-only). */
export function bureauxNominationLimits() {
  return { maxPerDay: 2, maxOpen: 8 };
}

/** Notes per film per day for Bureaux members. */
export function bureauxPlusNoteLimit() {
  return 4;
}

/** Display price for UI (cents). Default $100/year until env overrides. */
export function getBureauxAnnualAmountCents(): number {
  const raw = process.env.NEXT_PUBLIC_BUREAUX_ANNUAL_CENTS;
  const n = raw ? Number(raw) : 10000;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10000;
}

/** Deduped per request — shell + pages often ask for the same row. */
export const getOwnBureauxMembership = cache(
  async (userId?: string): Promise<BureauxMembership | null> => {
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
      .select(MEMBERSHIP_SELECT)
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.error('getOwnBureauxMembership failed:', error.message);
      return null;
    }
    if (!data) return null;

    return mapMembershipRow(data as Record<string, unknown>);
  }
);

/** Service-role read (admin / gift redeem). */
export async function getBureauxMembershipByUserId(
  userId: string
): Promise<BureauxMembership | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('bureaux_memberships')
    .select(MEMBERSHIP_SELECT)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapMembershipRow(data as Record<string, unknown>);
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
    .select('bureaux_number, status, current_period_end, comp_lifetime')
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
        : null,
      Boolean(existing.comp_lifetime)
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

/** Upsert from Stripe webhook (service role). Preserves comp/gift fields. */
export async function upsertBureauxMembership(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: BureauxStatus;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const db = createServiceClient();

  const existing = await getBureauxMembershipByUserId(input.userId);
  // Lifetime comps are not overwritten by Stripe lifecycle events.
  if (existing?.comp_lifetime) {
    if (input.stripeCustomerId || input.stripeSubscriptionId) {
      await db
        .from('bureaux_memberships')
        .update({
          stripe_customer_id:
            input.stripeCustomerId ?? existing.stripe_customer_id,
          stripe_subscription_id:
            input.stripeSubscriptionId ?? existing.stripe_subscription_id,
        })
        .eq('user_id', input.userId);
    }
    await ensureBureauxNumber(input.userId);
    return;
  }

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
      source: existing?.source === 'gift' ? 'gift' : 'stripe',
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('upsertBureauxMembership failed:', error.message);
    throw error;
  }

  if (
    isBureauxActive(input.status, input.currentPeriodEnd?.toISOString() ?? null)
  ) {
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

/** Create or resolve auth user by email (public signups may be disabled). */
export async function ensureAuthUserByEmail(
  email: string
): Promise<{ id: string; email: string }> {
  const trimmed = email.trim().toLowerCase();
  const admin = createServiceClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: trimmed,
    email_confirm: true,
    user_metadata: { join_via: 'bureaux' },
  });

  if (created?.user?.id) {
    return { id: created.user.id, email: trimmed };
  }

  if (error && /already|registered|exists/i.test(error.message)) {
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: trimmed,
      });
    if (linkData?.user?.id) {
      return { id: linkData.user.id, email: trimmed };
    }
    throw linkErr || error;
  }

  throw error || new Error('Could not create account');
}

/** Admin: lifetime complimentary Bureaux seat. */
export async function grantBureauxLifetime(email: string): Promise<{
  userId: string;
  bureauxNumber: number | null;
}> {
  const ensured = await ensureAuthUserByEmail(email);
  const db = createServiceClient();
  const { error } = await db.from('bureaux_memberships').upsert(
    {
      user_id: ensured.id,
      status: 'active',
      source: 'comp',
      comp_lifetime: true,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    { onConflict: 'user_id' }
  );
  if (error) throw new Error(error.message);

  const n = await ensureBureauxNumber(ensured.id);
  return { userId: ensured.id, bureauxNumber: n };
}

/** Activate a 1-year gift membership (no Stripe sub). */
export async function activateGiftMembership(input: {
  userId: string;
  sponsoredByUserId: string;
}): Promise<void> {
  const db = createServiceClient();
  const existing = await getBureauxMembershipByUserId(input.userId);
  if (existing?.comp_lifetime) return;
  if (isBureauxMembershipActive(existing)) {
    throw new Error('alreadyActive');
  }

  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const { error } = await db.from('bureaux_memberships').upsert(
    {
      user_id: input.userId,
      status: 'active',
      source: 'gift',
      sponsored_by_user_id: input.sponsoredByUserId,
      comp_lifetime: false,
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: true,
      stripe_subscription_id: null,
    },
    { onConflict: 'user_id' }
  );
  if (error) throw new Error(error.message);
  await ensureBureauxNumber(input.userId);
}

export type BureauxLineage = {
  sponsoredByNumber: number | null;
  broughtInCount: number;
};

/** Lineage for the signed-in member’s mark. Deduped per request. */
export const getOwnBureauxLineage = cache(
  async (userId: string): Promise<BureauxLineage> => {
    const db = createServiceClient();
    const own = await getOwnBureauxMembership(userId);

    let sponsoredByNumber: number | null = null;
    if (own?.sponsored_by_user_id) {
      const { data: sponsor } = await db
        .from('bureaux_memberships')
        .select('bureaux_number')
        .eq('user_id', own.sponsored_by_user_id)
        .maybeSingle();
      const n = Number(sponsor?.bureaux_number);
      if (Number.isFinite(n) && n >= 1) sponsoredByNumber = n;
    }

    const { count } = await db
      .from('bureaux_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('sponsored_by_user_id', userId);

    return {
      sponsoredByNumber,
      broughtInCount: count || 0,
    };
  }
);
