'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ManualHelpButton from '@/components/help/ManualHelpButton';

function manualLink(slug: string) {
  return (chunks: React.ReactNode) => (
    <ManualHelpButton slug={slug} audience="guest" variant="link">
      {chunks}
    </ManualHelpButton>
  );
}

/** Included perks — Manual terms open the card modal. */
export default function BureauxIncludedList() {
  const t = useTranslations('Bureaux');

  const perks = [
    {
      key: 'nominate',
      node: t.rich('perkNominate', { manual: manualLink('nominate') }),
    },
    {
      key: 'bounties',
      node: t.rich('perkBounties', { manual: manualLink('bounties') }),
    },
    {
      key: 'plus',
      node: t.rich('perkPlus', { manual: manualLink('plus') }),
    },
    {
      key: 'early',
      node: t.rich('perkEarly', { manual: manualLink('bounties') }),
    },
    { key: 'behind', node: t('perkBehind') },
    { key: 'number', node: t('perkNumber') },
  ];

  return (
    <div className="w-full max-w-sm flex flex-col gap-1.5 text-left sm:text-center">
      <h2 className="m-0 mb-0.5 font-sans text-[12px] font-semibold text-page-muted select-none">
        {t('perksTitle')}
      </h2>
      <ul className="m-0 p-0 list-none flex flex-col gap-1">
        {perks.map((perk) => (
          <li
            key={perk.key}
            className="font-sans text-[14px] text-page leading-snug"
          >
            {perk.node}
          </li>
        ))}
      </ul>
      <p className="m-0 mt-1 font-sans text-[14px] font-semibold text-page leading-snug">
        {t('perkClosing')}
      </p>
    </div>
  );
}
