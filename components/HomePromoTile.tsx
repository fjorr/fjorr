import React from 'react';
import { Link } from '@/i18n/navigation';

type HomePromoTileProps = {
  href: string;
  headline: string;
  subhead: string;
  cta: string;
  bgClassName: string;
  /** Futura display vs Inter Tight (tiles default to Inter Tight). */
  headlineStyle?: 'futura' | 'interTight';
  /** `banner` = full-width lead; `tile` = grid cell. */
  layout?: 'tile' | 'banner';
};

/**
 * Apple-style home promo cell — used in HomePromoGrid.
 */
export default function HomePromoTile({
  href,
  headline,
  subhead,
  cta,
  bgClassName,
  headlineStyle,
  layout = 'tile',
}: HomePromoTileProps) {
  const isBanner = layout === 'banner';
  const useInterTight = headlineStyle
    ? headlineStyle === 'interTight'
    : !isBanner;
  const headlineClass = useInterTight
    ? 'font-interTight font-extrabold tracking-tight'
    : 'font-futura font-extrabold uppercase tracking-tighter';

  return (
    <Link
      href={href}
      className={`group relative block w-full overflow-hidden rounded-[8px] text-white ${bgClassName} ${
        isBanner
          ? // Lead tile: tall on mobile, wide banner from sm up.
            'aspect-[4/5] min-h-[340px] sm:aspect-[21/9] sm:min-h-[260px]'
          : // Secondary: portrait tiles.
            'aspect-[3/4] min-h-[240px] sm:min-h-0'
      }`}
    >
      <div
        className={`absolute inset-0 flex flex-col ${
          isBanner
            ? 'justify-end items-start text-left p-6 sm:p-8 md:p-10 max-w-xl'
            : 'justify-start items-center text-center p-5 sm:p-6 md:p-7'
        }`}
      >
        <h2
          className={`${headlineClass} leading-[1.05] mb-2 sm:mb-2.5 ${
            isBanner
              ? 'text-[clamp(2.25rem,8vw,3.25rem)]'
              : 'text-[clamp(1.2rem,2.4vw,1.45rem)]'
          }`}
        >
          {headline}
        </h2>
        <p
          className={`font-sans font-medium leading-relaxed text-white/70 tracking-tight ${
            isBanner
              ? 'text-[16px] sm:text-[18px] mb-5 sm:mb-6 max-w-md'
              : 'text-[12px] sm:text-[13px] mb-4 sm:mb-5 max-w-[16rem]'
          }`}
        >
          {subhead}
        </p>
        <span
          className={`inline-flex items-center rounded-full bg-white text-black font-sans font-bold group-hover:bg-white/90 transition-colors ${
            isBanner
              ? 'h-10 px-5 text-[13px]'
              : 'h-9 px-4 text-[12px] sm:h-10 sm:px-5 sm:text-[13px]'
          }`}
        >
          {cta}
        </span>
      </div>
    </Link>
  );
}
