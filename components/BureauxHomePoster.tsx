import React from 'react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const POSTER_IMAGE =
  'https://media.fjorr.com/assets/fjorr-home-bureaux-breakdancing.avif';

export type BureauxHomePosterVariant = 'banner' | 'compact';

/** Home promo — light: black/off-white type; dark: off-white/dark type. */
export default async function BureauxHomePoster({
  variant = 'banner',
}: {
  variant?: BureauxHomePosterVariant;
}) {
  const t = await getTranslations('Bureaux');

  if (variant === 'compact') {
    return (
      <Link
        href="/bureaux"
        className="group flex w-full items-center gap-5 sm:gap-6 rounded-[8px] bg-black text-[#F3EDE6] dark:bg-[#F3EDE6] dark:text-black px-5 py-5 sm:px-7 sm:py-6"
      >
        <div className="flex min-w-0 flex-1 flex-col items-start text-left gap-3">
          <div className="min-w-0">
            <h2 className="font-futura font-extrabold uppercase tracking-tighter leading-[1.05] text-[clamp(1.5rem,4vw,2rem)]">
              {t('homePosterHeadline')}
            </h2>
            <p className="mt-1.5 font-sans font-medium leading-snug text-[#F3EDE6]/70 dark:text-black/60 tracking-tight text-[14px] sm:text-[15px]">
              {t('homePosterSubhead')}
            </p>
          </div>
          <span className="inline-flex items-center h-9 px-4 rounded-full bg-[#F3EDE6] text-black dark:bg-black dark:text-[#F3EDE6] font-sans font-bold text-[12px] sm:text-[13px] group-hover:opacity-90 transition-opacity">
            {t('homePosterCta')}
          </span>
        </div>

        <div className="relative hidden sm:block w-[88px] h-[88px] shrink-0 overflow-hidden rounded-[8px]">
          <Image
            src={POSTER_IMAGE}
            alt=""
            fill
            sizes="88px"
            className="object-cover object-center"
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/bureaux"
      className="group relative block w-full overflow-hidden rounded-[8px] aspect-[4/5] min-h-[340px] sm:aspect-[21/9] sm:min-h-[260px] bg-black text-[#F3EDE6] dark:bg-[#F3EDE6] dark:text-black"
    >
      <div className="absolute inset-0 flex flex-col sm:flex-row sm:items-stretch gap-8 sm:gap-6 md:gap-7 p-7 sm:p-9 md:p-10 lg:p-12">
        <div className="flex flex-col justify-end sm:justify-center items-start text-left shrink-0 sm:w-[38%] sm:max-w-md min-w-0">
          <h2 className="font-futura font-extrabold uppercase tracking-tighter leading-[1.05] mb-2 sm:mb-2.5 text-[clamp(2.25rem,8vw,3.25rem)]">
            {t('homePosterHeadline')}
          </h2>
          <p className="font-sans font-medium leading-relaxed text-[#F3EDE6]/70 dark:text-black/60 tracking-tight text-[16px] sm:text-[18px] mb-5 sm:mb-6 max-w-md">
            {t('homePosterSubhead')}
          </p>
          <span className="inline-flex items-center h-10 px-5 rounded-full bg-[#F3EDE6] text-black dark:bg-black dark:text-[#F3EDE6] font-sans font-bold text-[13px] group-hover:opacity-90 transition-opacity">
            {t('homePosterCta')}
          </span>
        </div>

        <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-[8px]">
          <Image
            src={POSTER_IMAGE}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 60vw"
            className="object-cover object-[80%_center] sm:object-center"
            priority
          />
        </div>
      </div>
    </Link>
  );
}
