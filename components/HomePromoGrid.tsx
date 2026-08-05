import React from 'react';
import BureauxHomePoster from '@/components/BureauxHomePoster';
import HomePromoGate from '@/components/HomePromoGate';

/** Home promo band — Bureaux only (gated by search/filters + mode). */
export default function HomePromoGrid() {
  return (
    <HomePromoGate
      banner={<BureauxHomePoster variant="banner" />}
      compact={<BureauxHomePoster variant="compact" />}
    />
  );
}
