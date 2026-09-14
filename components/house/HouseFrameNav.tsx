'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/Icons';

type Props = {
  onPrev: () => void;
  onNext: () => void;
  visible?: boolean;
  /** Need at least two films to show. */
  enabled?: boolean;
};

/** Compact chevrons on the poster frame edges. */
export default function HouseFrameNav({
  onPrev,
  onNext,
  visible = true,
  enabled = true,
}: Props) {
  const t = useTranslations('Film');

  if (!visible || !enabled) return null;

  const chevronBtn =
    'absolute top-1/2 z-30 flex h-14 w-10 -translate-y-1/2 items-center justify-center text-white/80 drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] transition-colors hover:text-white';

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }}
        aria-label={t('previousFilm')}
        className={`${chevronBtn} left-0`}
      >
        <Icon
          name="chevronCompactBack"
          className="!h-[18px] !w-[5px]"
          aria-hidden
        />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        aria-label={t('nextFilm')}
        className={`${chevronBtn} right-0`}
      >
        <Icon
          name="chevronCompactForward"
          className="!h-[18px] !w-[5px]"
          aria-hidden
        />
      </button>
    </>
  );
}
