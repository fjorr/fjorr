import React from 'react';
import { getTranslations } from 'next-intl/server';
import HomePromoTile from '@/components/HomePromoTile';

/** Home promo tile — Plus Machine. */
export default async function PlusHomePoster() {
  const t = await getTranslations('Plus');

  return (
    <HomePromoTile
      href="/manual/plus"
      headline={t('homePosterHeadline')}
      subhead={t('homePosterSubhead')}
      cta={t('homePosterCta')}
      bgClassName="bg-[#2A241C]"
    />
  );
}
