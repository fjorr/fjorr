/** Client-safe Bureaux status helpers (no server-only imports). */

export type BureauxStatus =
  | 'none'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid';

/** Active subscription, past_due grace, canceled-but-paid, or admin lifetime. */
export function isBureauxActive(
  status: BureauxStatus | string | null | undefined,
  currentPeriodEnd?: string | null,
  compLifetime?: boolean | null
) {
  if (compLifetime && (status === 'active' || status === 'past_due')) {
    return true;
  }
  if (status === 'active' || status === 'past_due') return true;
  if (status === 'canceled' && currentPeriodEnd) {
    return new Date(currentPeriodEnd).getTime() > Date.now();
  }
  return false;
}

export function isBureauxMembershipActive(
  membership: {
    status: BureauxStatus | string | null | undefined;
    current_period_end?: string | null;
    comp_lifetime?: boolean | null;
  } | null
) {
  if (!membership) return false;
  return isBureauxActive(
    membership.status,
    membership.current_period_end,
    membership.comp_lifetime
  );
}
