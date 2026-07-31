import React from 'react';
import { getTranslations } from 'next-intl/server';
import { listActiveBounties } from '@/lib/nomination-actions';
import HomePromoTile from '@/components/HomePromoTile';

function formatUpTo(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100)}`;
  }
}

/** Home promo tile — open bounties. */
export default async function BountyHomePoster() {
  const t = await getTranslations('Bounties');
  const bounties = await listActiveBounties();
  const top = bounties.reduce<{ cents: number; currency: string } | null>(
    (best, b) => {
      if (!best || b.reward_amount > best.cents) {
        return { cents: b.reward_amount, currency: b.currency };
      }
      return best;
    },
    null
  );
  const amountLabel = top
    ? formatUpTo(top.cents, top.currency)
    : '$500';

  return (
    <HomePromoTile
      href="/bounties"
      headline={t('homePosterHeadline')}
      subhead={t('homePosterSubhead', { amount: amountLabel })}
      cta={t('homePosterCta')}
      bgClassName="bg-[#2A4034]"
    />
  );
}
