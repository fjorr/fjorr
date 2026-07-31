import React from 'react';
import { getTranslations } from 'next-intl/server';
import HomePromoTile from '@/components/HomePromoTile';

/** Home promo tile — The Cabinet. */
export default async function CabinetHomePoster() {
  const t = await getTranslations('Cabinet');

  return (
    <HomePromoTile
      href="/cabinet"
      headline={t('homePosterHeadline')}
      subhead={t('homePosterSubhead')}
      cta={t('homePosterCta')}
      bgClassName="bg-[#1B2838]"
    />
  );
}
