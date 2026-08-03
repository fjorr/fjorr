'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import VoyageurBadgeMark from '@/components/VoyageurBadgeMark';

const ViewerStampShare = dynamic(() => import('@/components/ViewerStampShare'), {
  ssr: false,
});

/** Own Voyages — tap the mark to share (via). */
export default function FilmLogBadgeButton({
  filmName,
  filmSlug,
  filmPoster = null,
  viewerNumber,
  filmVersion = 1,
  memberNumber,
  recordedAt,
}: {
  filmName: string;
  filmSlug: string;
  filmPoster?: string | null;
  viewerNumber: number;
  filmVersion?: number;
  memberNumber: number;
  recordedAt?: string | null;
}) {
  const t = useTranslations('Film');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left outline-none transition-opacity hover:opacity-90 focus-visible:rounded-[8px] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--page-fg)_28%,transparent)]"
        aria-label={`${t('voyageurBadgeTitle', { number: viewerNumber })}. ${t('stampShareTitle')}`}
      >
        <VoyageurBadgeMark
          filmName={filmName}
          filmPoster={filmPoster}
          voyageurNumber={viewerNumber}
          recordedAt={recordedAt}
        />
      </button>
      {open ? (
        <ViewerStampShare
          open
          onClose={() => setOpen(false)}
          filmName={filmName}
          filmSlug={filmSlug}
          filmPoster={filmPoster}
          viewerNumber={viewerNumber}
          filmVersion={filmVersion}
          memberNumber={memberNumber}
          recordedAt={recordedAt}
        />
      ) : null}
    </>
  );
}
