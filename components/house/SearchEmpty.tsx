'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function SearchEmpty() {
  const t = useTranslations('Search');
  const slate = useTranslations('Slate');

  return (
    <div className="mx-auto w-full max-w-[44rem] py-2.5">
      <p className="m-0 font-[family-name:var(--font-circular-black)] text-[24px] font-[900] leading-none tracking-[-0.03em] text-[#0B0B0C] sm:text-[28px] md:text-[32px]">
        {t('nothingMatches')}
      </p>
      <Link
        href="/nominate"
        className="mt-3 inline-block font-sans text-[15px] font-medium text-[#0B0B0C]"
      >
        {slate('proposePill')}
      </Link>
    </div>
  );
}
