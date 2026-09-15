'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

/** Launch perks — fund free films; hide community-platform promises. */
export default function BureauxIncludedList({
  align = 'left',
  bullets = false,
  uniform = false,
  quiet = false,
}: {
  align?: 'left' | 'center';
  bullets?: boolean;
  /** Match join slide type: Inter Tight semibold 20px / normal leading. */
  uniform?: boolean;
  /** Soft footnote-style perks for the join pitch. */
  quiet?: boolean;
}) {
  const t = useTranslations('Bureaux');

  const perks = [
    { key: 'number', node: t('perkNumber') },
    { key: 'behind', node: t('perkBehind') },
    { key: 'earlyFilms', node: t('perkEarlyFilms') },
  ];

  const centered = align === 'center';

  if (quiet) {
    return (
      <div
        className={`flex w-full max-w-md flex-col gap-2 ${
          centered ? 'mx-auto items-center text-center' : 'text-left'
        }`}
      >
        <p className="m-0 font-interTight text-[12px] font-semibold tracking-[0.04em] text-black/35 uppercase select-none">
          {t('perksTitle')}
        </p>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {perks.map((perk) => (
            <li
              key={perk.key}
              className="font-interTight text-[15px] font-medium leading-snug tracking-tight text-black/45 md:text-[16px]"
            >
              {perk.node}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const type = uniform
    ? 'font-interTight text-[20px] font-semibold leading-normal text-[#0B0B0C]'
    : null;

  return (
    <div
      className={`flex w-full max-w-md flex-col gap-1.5 ${
        centered ? 'mx-auto items-center text-center' : 'text-left'
      } ${type ?? ''}`}
    >
      <h2
        className={`m-0 mb-0.5 select-none ${
          type ?? 'font-sans text-[12px] font-semibold text-page-muted'
        }`}
      >
        {bullets ? t('perksTitleColon') : t('perksTitle')}
      </h2>
      <ul
        className={`m-0 flex flex-col gap-1.5 p-0 ${
          bullets ? 'list-disc pl-5 marker:text-current' : 'list-none'
        } ${centered && !bullets ? 'items-center' : ''}`}
      >
        {perks.map((perk) => (
          <li
            key={perk.key}
            className={
              type ??
              'font-interTight text-[17px] font-semibold leading-snug tracking-tight text-page sm:text-[18px]'
            }
          >
            {perk.node}
          </li>
        ))}
      </ul>
    </div>
  );
}
