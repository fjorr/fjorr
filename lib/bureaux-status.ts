/** Client-safe Bureaux status helpers (no server-only imports). */

export type BureauxStatus =
  | 'none'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid';

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
  membership: {
    status: BureauxStatus | string | null | undefined;
    current_period_end?: string | null;
  } | null
) {
  if (!membership) return false;
  return isBureauxActive(membership.status, membership.current_period_end);
}
