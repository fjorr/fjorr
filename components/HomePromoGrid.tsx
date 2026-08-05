import React from 'react';
import BureauxHomePoster from '@/components/BureauxHomePoster';

/** Home promo band — Bureaux only. */
export default function HomePromoGrid() {
  return (
    <section className="w-full px-8 md:px-16 mt-12 md:mt-16 mb-4 md:mb-8">
      <div className="w-full max-w-[1440px] mx-auto">
        <BureauxHomePoster />
      </div>
    </section>
  );
}
