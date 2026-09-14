'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuthPresence } from '@/components/AuthPresenceProvider';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';
import { fetchOwnBureauxActive } from '@/lib/bureaux-client';

/**
 * “Account” in the nav lump — active Bureaux members only.
 * Guests / non-members use Join instead.
 */
export default function NavbarAccountLink({
  className = '',
}: {
  className?: string;
}) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const { close } = useHouseOverlay();
  const { signedIn } = useAuthPresence();
  const [member, setMember] = useState<boolean | null>(null);

  const onAccount =
    pathname === '/account' || pathname.startsWith('/account/');

  useEffect(() => {
    if (signedIn === false) {
      setMember(false);
      return;
    }
    if (signedIn !== true) {
      setMember(null);
      return;
    }
    let cancelled = false;
    fetchOwnBureauxActive().then((active) => {
      if (!cancelled) setMember(active);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  if (signedIn !== true || member !== true) return null;

  return (
    <Link
      href="/account/voyages"
      aria-label={t('account')}
      aria-current={onAccount ? 'page' : undefined}
      onClick={() => {
        if (onAccount) close();
      }}
      className={`font-sans text-[13px] font-semibold tracking-normal transition-colors ${className}`}
    >
      {t('accountShort')}
    </Link>
  );
}
