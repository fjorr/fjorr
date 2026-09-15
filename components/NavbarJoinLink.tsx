'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuthPresence } from '@/components/AuthPresenceProvider';
import { useHouseOverlay } from '@/components/HouseOverlayProvider';

/**
 * Guest nav: Join + Enter. Signed-in non-members: Join only.
 * Hidden for active Bureaux members (they see Account).
 */
export default function NavbarJoinLink({
  className = '',
  mutedClassName = '',
  activeClassName = '',
}: {
  className?: string;
  /** Inactive nav label (e.g. white/55). */
  mutedClassName?: string;
  /** Current-page label (e.g. white / black). */
  activeClassName?: string;
}) {
  const t = useTranslations('Nav');
  const pathname = usePathname() || '';
  const { close } = useHouseOverlay();
  const { signedIn, bureauxMember } = useAuthPresence();

  const onBureaux =
    pathname === '/bureaux' || pathname.startsWith('/bureaux/');
  const onSignIn =
    pathname === '/signin' || pathname.startsWith('/signin/');

  if (signedIn === null) return null;
  // Members (or membership still resolving) — Account link owns this slot.
  if (signedIn === true && bureauxMember !== false) return null;

  const tone = (active: boolean) =>
    `font-sans text-[13px] font-semibold tracking-normal transition-colors ${
      active ? activeClassName || mutedClassName : mutedClassName
    } ${className}`;

  // Already signed in — join is the only door.
  if (signedIn === true) {
    return (
      <Link
        href="/bureaux"
        aria-current={onBureaux ? 'page' : undefined}
        onClick={() => {
          if (onBureaux) close();
        }}
        className={tone(onBureaux)}
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
        className={tone(onBureaux)}
      >
        {t('join')}
      </Link>
      <Link
        href="/signin"
        aria-current={onSignIn ? 'page' : undefined}
        onClick={() => {
          if (onSignIn) close();
        }}
        className={tone(onSignIn)}
      >
        {t('enter')}
      </Link>
    </span>
  );
}
