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
  headlineStyle = 'futura',
  layout = 'tile',
}: HomePromoTileProps) {
  const isBanner = layout === 'banner';
  const headlineClass =
    headlineStyle === 'interTight'
      ? 'font-interTight font-extrabold capitalize tracking-normal'
      : 'font-futura font-extrabold uppercase tracking-tighter';

  return (
    <Link
      href={href}
      className={`group relative block w-full overflow-hidden rounded-[8px] text-white ${bgClassName} ${
        isBanner
          ? // Lead tile: tall on mobile, wide banner from sm up.
            'aspect-[4/5] min-h-[340px] sm:aspect-[21/9] sm:min-h-[260px]'
          : // Secondary: compact on mobile stack, square/landscape in the row.
            'aspect-[16/10] min-h-[160px] sm:aspect-square sm:min-h-0 lg:aspect-[5/4]'
      }`}
    >
      <div
        className={`absolute inset-0 flex flex-col justify-end items-start text-left ${
          isBanner
            ? 'p-6 sm:p-8 md:p-10 max-w-xl'
            : 'p-5 sm:p-8 md:p-10 max-w-md'
        }`}
      >
        <h2
          className={`${headlineClass} leading-[0.95] mb-2.5 sm:mb-3 ${
            isBanner
              ? 'text-[clamp(2.25rem,8vw,3.25rem)]'
              : 'text-[clamp(1.35rem,4vw,2.5rem)]'
          }`}
        >
          {headline}
        </h2>
        <p
          className={`font-sans font-medium leading-relaxed text-white/70 tracking-tight ${
            isBanner
              ? 'text-[13px] sm:text-[14px] mb-5 sm:mb-6 max-w-sm'
              : 'text-[12px] sm:text-[14px] mb-4 sm:mb-6 max-w-xs line-clamp-2 sm:line-clamp-none'
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
