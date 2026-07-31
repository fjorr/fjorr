import React from 'react';
import BountyHomePoster from '@/components/BountyHomePoster';
import BureauxHomePoster from '@/components/BureauxHomePoster';
import CabinetHomePoster from '@/components/CabinetHomePoster';
import PlusHomePoster from '@/components/PlusHomePoster';

/** Cine home promo band — 2×2 Apple-style grid. */
export default function HomePromoGrid() {
  return (
    <section className="w-full px-8 md:px-16 mt-12 md:mt-16 mb-4 md:mb-8">
      <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <BountyHomePoster />
        <BureauxHomePoster />
        <CabinetHomePoster />
        <PlusHomePoster />
      </div>
    </section>
  );
}
