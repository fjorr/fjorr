import React from 'react';
import { Link } from '@/i18n/navigation';

type HomePromoTileProps = {
  href: string;
  headline: string;
  subhead: string;
  cta: string;
  bgClassName: string;
  /** Futura display vs Inter Tight (bounties). */
  headlineStyle?: 'futura' | 'interTight';
};

/**
 * Apple-style home promo cell — equal tiles in HomePromoGrid.
 */
export default function HomePromoTile({
  href,
  headline,
  subhead,
  cta,
  bgClassName,
  headlineStyle = 'futura',
}: HomePromoTileProps) {
  const headlineClass =
    headlineStyle === 'interTight'
      ? 'font-interTight font-extrabold capitalize tracking-normal'
      : 'font-futura font-extrabold uppercase tracking-tighter';

  return (
    <Link
      href={href}
      className={`group relative block w-full overflow-hidden rounded-[8px] aspect-[3/4] sm:aspect-square lg:aspect-[5/4] text-white ${bgClassName}`}
    >
      <div className="absolute inset-0 flex flex-col justify-end items-start text-left p-6 sm:p-8 md:p-10 max-w-md">
        <h2
          className={`${headlineClass} text-[clamp(1.65rem,3.6vw,2.5rem)] leading-[0.95] mb-2.5 sm:mb-3`}
        >
          {headline}
        </h2>
        <p className="font-sans font-medium text-[13px] sm:text-[14px] leading-relaxed text-white/70 mb-5 sm:mb-6 max-w-xs tracking-tight">
          {subhead}
        </p>
        <span className="inline-flex h-10 px-5 rounded-full bg-white text-black font-sans text-[13px] font-bold items-center group-hover:bg-white/90 transition-colors">
          {cta}
        </span>
      </div>
    </Link>
  );
}
