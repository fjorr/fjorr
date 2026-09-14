'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import AccountNavLink from '@/components/AccountNavLink';

const LINKS = [
  {
    href: '/about',
    labelKey: 'about' as const,
    descKey: 'exploreAboutDesc' as const,
  },
];

const ROW =
  'flex w-full items-baseline gap-2.5 border-0 bg-transparent px-0 py-1.5 text-left md:gap-3 md:py-2';
const PRIMARY =
  'font-interTight text-[16px] font-semibold leading-none tracking-tight md:text-[18px] lg:text-[20px]';
const DESC = 'font-sans text-[13px] font-medium leading-none md:text-[14px]';

export default function HouseMenu({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '/';

  return (
    <div
      role="dialog"
      aria-label={t('exploreHeadline')}
      className="absolute inset-0 z-50 flex flex-col bg-white text-[#0B0B0C]"
    >
      <p className="shrink-0 font-sans text-[17px] font-bold leading-none tracking-tight text-[#0B0B0C] md:text-[22px] lg:text-[24px]">
        {t('exploreHeadline')}
      </p>
      <nav className="mt-4 min-h-0 flex-1 overflow-auto md:mt-5" aria-label={t('exploreHeadline')}>
        <ul className="flex flex-col">
          {LINKS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const body = (
              <>
                <span
                  className={`${PRIMARY} ${
                    active ? 'text-black/35' : 'text-[#0B0B0C]'
                  }`}
                >
                  {t(item.labelKey)}
                </span>
                <span
                  className={`${DESC} ${active ? 'text-black/35' : 'text-black/40'}`}
                >
                  {t(item.descKey)}
                </span>
              </>
            );
            return (
              <li key={item.href}>
                {active ? (
                  <span aria-current="page" className={`${ROW} cursor-default`}>
                    {body}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`${ROW} hover:opacity-55`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
          <AccountNavLink variant="explore" onNavigate={onClose} />
        </ul>
      </nav>
    </div>
  );
}
