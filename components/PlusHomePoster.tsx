import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * Home cine promo — Plus Machine.
 * Cinescope on desktop, vertical on mobile.
 */
export default async function PlusHomePoster() {
  const t = await getTranslations('Plus');

  return (
    <section className="w-full px-8 md:px-16 mt-8 md:mt-10 mb-4 md:mb-8">
      <div className="w-full max-w-[1440px] mx-auto">
        <Link
          href="/plus"
          className="group relative block w-full overflow-hidden rounded-[8px] aspect-[3/4] md:aspect-[2.39/1] bg-[#2A241C] text-white"
        >
          <div className="absolute inset-0 flex flex-col justify-end md:justify-center items-start text-left p-7 sm:p-10 md:p-12 lg:p-14 max-w-xl">
            <h2 className="font-futura font-extrabold uppercase tracking-tighter text-[clamp(2rem,6vw,3.5rem)] leading-[0.9] mb-3 sm:mb-4">
              {t('homePosterHeadline')}
            </h2>
            <p className="font-sans font-medium text-[14px] sm:text-[15px] leading-relaxed text-white/70 mb-6 sm:mb-8 max-w-sm tracking-tight">
              {t('homePosterSubhead')}
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
