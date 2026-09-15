'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { useAuthPresence } from '@/components/AuthPresenceProvider';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';

/**
 * “Account” in the nav — any signed-in person (member or unpaid).
 * Opens the account poster sheet (same frame as house heroes).
 */
export default function NavbarAccountLink({
  className = '',
  mutedClassName = '',
  activeClassName = '',
}: {
  className?: string;
  mutedClassName?: string;
  activeClassName?: string;
}) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const { toggle, isOpen, close } = useHouseOverlay();
  const { signedIn } = useAuthPresence();

  const onAccount =
    pathname === '/account' || pathname.startsWith('/account/');
  const accountOpen = isOpen('account');
  const active = accountOpen || onAccount;

  if (signedIn !== true) return null;

  return (
    <button
      type="button"
      aria-label={t('account')}
      aria-expanded={accountOpen}
      aria-current={onAccount && !accountOpen ? 'page' : undefined}
      onClick={() => {
        if (accountOpen) {
          close();
          return;
        }
        toggle('account');
      }}
      className={`border-0 bg-transparent p-0 font-sans text-[13px] font-semibold tracking-normal transition-colors ${
        active ? activeClassName || mutedClassName : mutedClassName
      } ${className}`}
    >
      {t('accountShort')}
    </button>
  );
}
