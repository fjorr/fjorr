'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import VoyageurBadgeMark from '@/components/VoyageurBadgeMark';
import type { VoyageurStamp } from '@/lib/film-record-actions';

const ViewerStampShare = dynamic(() => import('@/components/ViewerStampShare'), {
  ssr: false,
});

/**
 * Rams-quiet honor mark on the film page.
 * Tap opens the stamp sheet — what the number is, and Share/copy.
 */
export default function VoyageurBadge({
  stamp,
  filmName,
  filmSlug,
}: {
  stamp: VoyageurStamp;
  filmName: string;
  filmSlug: string;
}) {
  const t = useTranslations('Film');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 mb-2 cursor-pointer border-0 bg-transparent p-0 text-left outline-none transition-opacity hover:opacity-90 focus-visible:rounded-[8px] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--page-fg)_28%,transparent)]"
        aria-label={`${t('voyageurBadgeTitle', { number: stamp.voyageurNumber })}. ${t('stampShareTitle')}`}
      >
        <VoyageurBadgeMark
          voyageurNumber={stamp.voyageurNumber}
          filmVersion={stamp.filmVersion}
          memberNumber={stamp.memberNumber}
          recordedAt={stamp.recordedAt}
          tone="page"
        />
      </button>
      {open ? (
        <ViewerStampShare
          open
          onClose={() => setOpen(false)}
          filmName={filmName}
          filmSlug={filmSlug}
          viewerNumber={stamp.voyageurNumber}
          filmVersion={stamp.filmVersion}
          memberNumber={stamp.memberNumber}
          recordedAt={stamp.recordedAt}
        />
      ) : null}
    </>
  );
}
