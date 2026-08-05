'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthPresence } from '@/components/AuthPresenceProvider';

/**
 * Tiny cyan bolt on the hamburger — signed-in signal (no member number).
 * Positioned by the parent button (`relative`).
 */
export default function NavbarBureauxCue() {
  const t = useTranslations('Nav');
  const { signedIn } = useAuthPresence();

  if (!signedIn) return null;

  return (
    <span
      role="img"
      aria-label={t('signedInCueAria')}
      title={t('signedInCueAria')}
      className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 flex size-[11px] items-center justify-center text-[#22D3EE]"
    >
      <Zap
        size={11}
        strokeWidth={2.5}
        fill="currentColor"
        className="drop-shadow-[0_0_1px_rgba(0,0,0,0.35)]"
        aria-hidden
      />
    </span>
  );
}
