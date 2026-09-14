'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

type Props = {
  index: number;
  total: number;
  onSelect: (index: number) => void;
  className?: string;
};

/** Poster-page dots — sit on the image, not in the footer chrome. */
export default function HousePosterDots({
  index,
  total,
  onSelect,
  className = '',
}: Props) {
  const t = useTranslations('Film');

  if (total < 2) return null;

  return (
    <div
      className={`pointer-events-auto flex max-w-[min(48vw,16rem)] items-center justify-center gap-1.5 overflow-x-auto md:justify-end ${className}`}
      role="tablist"
      aria-label={t('browseHeadline')}
    >
      {Array.from({ length: total }, (_, i) => {
        const active = i === index;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${i + 1} / ${total}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              active
                ? 'w-4 bg-white'
                : 'w-1.5 bg-white/35 hover:bg-white/60'
            }`}
          />
        );
      })}
    </div>
  );
}
