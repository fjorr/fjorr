import React from 'react';
import { getTranslations } from 'next-intl/server';
import HomePromoTile from '@/components/HomePromoTile';

/** Home promo tile — The Bureaux (annual membership). */
export default async function BureauxHomePoster() {
  const t = await getTranslations('Bureaux');

  return (
    <HomePromoTile
      href="/bureaux"
      headline={t('homePosterHeadline')}
      subhead={t('homePosterSubhead')}
      cta={t('homePosterCta')}
      bgClassName="bg-[#2C2622]"
      layout="banner"
    />
  );
}
