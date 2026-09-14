'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const CHOICES = [
  {
    href: '/signin',
    labelKey: 'bureauxSignIn' as const,
    descKey: 'bureauxSignInDesc' as const,
  },
  {
    href: '/bureaux',
    labelKey: 'bureauxJoin' as const,
    descKey: 'bureauxJoinDesc' as const,
  },
];

/**
 * Bureaux doorway — Sign in and Join as equal posters.
 * Navigation keeps the sheet up until the route actually changes.
 */
export default function HouseBureauxSheet({
  onNavigate,
}: {
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '/';

  return (
    <div
      role="dialog"
      aria-label={t('bureauxChooserAria')}
      className="absolute inset-0 z-50 flex flex-col bg-white text-[#0B0B0C]"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-10 md:px-10 md:py-14">
        <nav
          aria-label={t('bureauxChooserAria')}
          className="grid w-full max-w-[720px] grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6"
        >
          {CHOICES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.href);
              }}
              aria-current={pathname === item.href ? 'page' : undefined}
              className="flex min-h-[220px] flex-col justify-between rounded-[24px] bg-[#F5F5F7] p-6 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 md:min-h-[260px] md:p-7"
            >
              <span className="font-interTight text-[28px] font-bold leading-none tracking-tight text-[#0B0B0C] md:text-[32px]">
                {t(item.labelKey)}
              </span>
              <span className="font-sans text-[15px] font-medium leading-snug text-black/45 md:text-[16px]">
                {t(item.descKey)}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
