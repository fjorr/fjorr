import React from 'react';
import BountyHomePoster from '@/components/BountyHomePoster';
import BureauxHomePoster from '@/components/BureauxHomePoster';
import CabinetHomePoster from '@/components/CabinetHomePoster';
import PlusHomePoster from '@/components/PlusHomePoster';

/** Home promo band — Bureaux lead, then three secondary tiles. */
export default function HomePromoGrid() {
  return (
    <section className="w-full px-8 md:px-16 mt-12 md:mt-16 mb-4 md:mb-8">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col gap-3 md:gap-4">
        <BureauxHomePoster />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <BountyHomePoster />
          <CabinetHomePoster />
          <PlusHomePoster />
        </div>
      </div>
    </section>
  );
}
