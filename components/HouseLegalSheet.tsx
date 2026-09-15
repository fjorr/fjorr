'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import SheetEnter from '@/components/house/SheetEnter';

const LEGAL_LINKS = [
  {
    href: '/privacy',
    labelKey: 'privacyShort' as const,
    descKey: 'privacyDesc' as const,
  },
  {
    href: '/terms',
    labelKey: 'termsShort' as const,
    descKey: 'termsDesc' as const,
  },
];

/**
 * Legal sheet — Privacy and Terms as two posters, side by side.
 * Navigation keeps the sheet up until the route actually changes.
 */
export default function HouseLegalSheet({
  onNavigate,
}: {
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations('Footer');
  const pathname = usePathname() || '/';

  return (
    <div
      role="dialog"
      aria-label={t('legalAria')}
      className="absolute inset-0 z-50 flex flex-col bg-white text-[#0B0B0C]"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-10 md:px-10 md:py-14">
        <nav
          aria-label={t('legalAria')}
          className="grid w-full max-w-[720px] grid-cols-2 gap-3 sm:gap-5 md:gap-6"
        >
          {LEGAL_LINKS.map((item, i) => (
            <SheetEnter key={item.href} delay={i * 80}>
              <Link
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(item.href);
                }}
                aria-current={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'page'
                    : undefined
                }
                className="flex min-h-[160px] flex-col justify-between rounded-[20px] bg-[#F5F5F7] p-4 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 sm:min-h-[220px] sm:rounded-[24px] sm:p-6 md:min-h-[260px] md:p-7"
              >
                <span className="font-interTight text-[22px] font-bold leading-none tracking-tight text-[#0B0B0C] sm:text-[28px] md:text-[32px]">
                  {t(item.labelKey)}
                </span>
                <span className="font-sans text-[13px] font-medium leading-snug text-black/45 sm:text-[15px] md:text-[16px]">
                  {t(item.descKey)}
                </span>
              </Link>
            </SheetEnter>
          ))}
        </nav>
      </div>
    </div>
  );
}
