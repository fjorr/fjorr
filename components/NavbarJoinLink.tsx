'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuthPresence } from '@/components/AuthPresenceProvider';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';
import { fetchOwnBureauxActive } from '@/lib/bureaux-client';

/**
 * Guest nav: Join + Enter. Signed-in non-members: Join only.
 * Hidden for active Bureaux members (they see Account).
 */
export default function NavbarJoinLink({
  className = '',
}: {
  className?: string;
}) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const { close } = useHouseOverlay();
  const { signedIn } = useAuthPresence();
  const [member, setMember] = useState<boolean | null>(null);

  const onBureaux =
    pathname === '/bureaux' || pathname.startsWith('/bureaux/');
  const onSignIn =
    pathname === '/signin' || pathname.startsWith('/signin/');

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

  if (signedIn === null) return null;
  if (signedIn === true && member !== false) return null;

  const labelClass = `font-sans text-[13px] font-semibold tracking-normal transition-colors ${className}`;

  // Already signed in — join is the only door.
  if (signedIn === true) {
    return (
      <Link
        href="/bureaux"
        aria-current={onBureaux ? 'page' : undefined}
        onClick={() => {
          if (onBureaux) close();
        }}
        className={labelClass}
      >
        {t('join')}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 sm:gap-3.5">
      <Link
        href="/bureaux"
        aria-current={onBureaux ? 'page' : undefined}
        onClick={() => {
          if (onBureaux) close();
        }}
        className={labelClass}
      >
        {t('join')}
      </Link>
      <Link
        href="/signin"
        aria-current={onSignIn ? 'page' : undefined}
        onClick={() => {
          if (onSignIn) close();
        }}
        className={labelClass}
      >
        {t('enter')}
      </Link>
    </span>
  );
}
