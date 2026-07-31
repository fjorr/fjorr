import React from 'react';
import { getTranslations } from 'next-intl/server';
import HomePromoTile from '@/components/HomePromoTile';

/** Temporary 4th home promo tile — Principles of a Myth. */
export default async function PrinciplesHomePoster() {
  const t = await getTranslations('Principles');

  return (
    <HomePromoTile
      href="/principles"
      headline={t('homePosterHeadline')}
      subhead={t('homePosterSubhead')}
      cta={t('homePosterCta')}
      bgClassName="bg-[#2C2622]"
    />
  );
}
