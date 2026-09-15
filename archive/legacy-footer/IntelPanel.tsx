'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { IntelForm } from '@/components/IntelForm';

/**
 * Intel sheet — email as headline, Subscribe pill, then “Rolling.” beat.
 */
export default function IntelPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Footer');
  const [phase, setPhase] = useState<'form' | 'confirm' | 'exiting'>('form');

  const outroActive = phase === 'confirm' || phase === 'exiting';

  useEffect(() => {
    // confirm → exiting must not remount this effect, or the close timer is cleared
    // and the sheet stays on a blank faded frame.
    if (!outroActive) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onClose();
      return;
    }

    const exitTimer = window.setTimeout(() => setPhase('exiting'), 1000);
    const closeTimer = window.setTimeout(() => onClose(), 1420);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(closeTimer);
    };
  }, [outroActive, onClose]);

  const confirming = phase === 'confirm' || phase === 'exiting';

  return (
    <div
      className={`flex h-full items-center justify-center overflow-y-auto px-5 py-10 md:px-10 md:py-14 ${
        phase === 'exiting' ? 'lang-hello-exit' : ''
      }`}
    >
      <div
        role="dialog"
        aria-label={t('intelHeadline')}
        aria-live={confirming ? 'polite' : undefined}
        className="flex w-full min-w-0 max-w-[min(92vw,720px)] flex-col items-center text-center"
      >
        {confirming ? (
          <span className="px-4 text-center font-interTight text-[clamp(3.25rem,12vw,8rem)] font-bold leading-none tracking-[-0.03em] text-[#0B0B0C]">
            {t('intelYoureIn')}
          </span>
        ) : (
          <>
            <div className="w-full min-w-0">
              <IntelForm
                variant="dark"
                isCustomVariant
                size="lg"
                onSuccess={() => setPhase('confirm')}
              />
            </div>
            <p className="mt-5 max-w-[20rem] text-balance font-sans text-[18px] font-normal leading-snug tracking-tight text-black/45 md:mt-6 md:max-w-[22rem] md:text-[20px]">
              {t('intelLead')}
            </p>
            <p className="mt-4 max-w-[20rem] font-sans text-[12px] font-medium leading-snug tracking-tight text-black/35 md:max-w-[22rem]">
              {t('intelRespect')}{' '}
              <Link
                href="/privacy"
                onClick={onClose}
                className="underline decoration-black/15 underline-offset-2 transition-colors hover:text-black/55 hover:decoration-black/30"
              >
                {t('privacy')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
