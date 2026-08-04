'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import CabinetOfferForm from '@/components/CabinetOfferForm';
import ManualHelpButton from '@/components/help/ManualHelpButton';

export default function CabinetClient({
  bureauxActive = false,
  defaultEmail = '',
}: {
  bureauxActive?: boolean;
  defaultEmail?: string;
}) {
  const t = useTranslations('Cabinet');

  return (
    <div className="w-full min-h-screen bg-[var(--page-bg)] text-page pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'The Cabinet | Fjorr',
            description: t('headline'),
            url: 'https://www.fjorr.com/cabinet',
          }),
        }}
      />

      <div className="w-full max-w-4xl mx-auto px-[10%] pt-14 sm:pt-20 flex flex-col items-center text-center">
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className="flex flex-col items-center">
            <p className="font-sans text-lg sm:text-xl font-semibold normal-case tracking-normal text-page select-none">
              {t('eyebrow')}
            </p>
            <h1 className="mt-2 sm:mt-2.5 mb-5 sm:mb-6 font-futura tracking-tighter text-page select-none text-5xl sm:text-6xl md:text-7xl !leading-[0.9] max-w-[12ch]">
              {t('headline')}
            </h1>
            <div className="font-sans font-medium text-[15px] sm:text-[16px] leading-[1.55] tracking-normal text-page max-w-md text-center flex flex-col gap-4">
              <p className="m-0">{t('disciplinesParagraph')}</p>
              <p className="m-0">{t('scoutLead')}</p>
            </div>
          </div>

          <footer className="mt-8 flex flex-col items-center gap-5 w-full text-center">
            <CabinetOfferForm
              bureauxActive={bureauxActive}
              defaultEmail={defaultEmail}
            />
            <ManualHelpButton
              slug="cabinet"
              audience={bureauxActive ? 'member' : 'guest'}
            />
          </footer>
        </div>
      </div>
    </div>
  );
}
