import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listActiveBounties } from '@/lib/nomination-actions';

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

/**
 * Home cine promo — solid-fill bounty poster under the film grid.
 * Cinescope on desktop, vertical on mobile. Art comes later.
 */
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
    <section className="w-full px-8 md:px-16 mt-12 md:mt-16">
      <div className="w-full max-w-[1440px] mx-auto">
        <Link
          href="/bounties"
          className="group relative block w-full overflow-hidden rounded-[8px] aspect-[3/4] md:aspect-[2.39/1] bg-[#2A4034] text-white"
        >
          <div className="absolute inset-0 flex flex-col justify-end md:justify-center items-start text-left p-7 sm:p-10 md:p-12 lg:p-14 max-w-xl">
            <h2 className="font-interTight font-extrabold capitalize tracking-normal text-[clamp(2rem,6vw,3.5rem)] leading-[0.9] mb-3 sm:mb-4">
              {t('homePosterHeadline')}
            </h2>
            <p className="font-sans font-medium text-[14px] sm:text-[15px] leading-relaxed text-white/70 mb-6 sm:mb-8 max-w-sm tracking-tight">
              {t('homePosterSubhead', { amount: amountLabel })}
            </p>
            <span className="inline-flex h-11 px-6 rounded-full bg-white text-black font-sans text-[13px] sm:text-[14px] font-bold items-center group-hover:bg-white/90 transition-colors">
              {t('homePosterCta')}
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
