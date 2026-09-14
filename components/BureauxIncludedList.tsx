'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

/** Launch perks — fund free films; hide community-platform promises. */
export default function BureauxIncludedList({
  align = 'left',
}: {
  align?: 'left' | 'center';
}) {
  const t = useTranslations('Bureaux');

  const perks = [
    { key: 'number', node: t('perkNumber') },
    { key: 'behind', node: t('perkBehind') },
    { key: 'earlyFilms', node: t('perkEarlyFilms') },
  ];

  const centered = align === 'center';

  return (
    <div
      className={`flex w-full max-w-md flex-col gap-1.5 ${
        centered ? 'mx-auto items-center text-center' : 'text-left'
      }`}
    >
      <h2 className="m-0 mb-0.5 font-sans text-[12px] font-semibold text-page-muted select-none">
        {t('perksTitle')}
      </h2>
      <ul
        className={`m-0 flex list-none flex-col gap-1.5 p-0 ${
          centered ? 'items-center' : ''
        }`}
      >
        {perks.map((perk) => (
          <li
            key={perk.key}
            className="font-interTight text-[17px] font-semibold leading-snug tracking-tight text-page sm:text-[18px]"
          >
            {perk.node}
          </li>
        ))}
      </ul>
    </div>
  );
}
