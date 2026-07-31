'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const ViewerStampShare = dynamic(() => import('@/components/ViewerStampShare'), {
  ssr: false,
});

/** Tiny share control for a Voyage row — opens stamp popup with Voyageur badge. */
export default function FilmLogShareButton({
  filmName,
  filmSlug,
  viewerNumber,
  filmVersion = 1,
  memberNumber,
  recordedAt,
}: {
  filmName: string;
  filmSlug: string;
  viewerNumber: number;
  filmVersion?: number;
  memberNumber?: number | null;
  recordedAt?: string | null;
}) {
  const t = useTranslations('Film');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-page-faint hover:text-page-muted transition-colors"
        aria-label={t('stampShareShort')}
      >
        {t('stampShareShort')}
      </button>
      {open ? (
        <ViewerStampShare
          open
          onClose={() => setOpen(false)}
          filmName={filmName}
          filmSlug={filmSlug}
          viewerNumber={viewerNumber}
          filmVersion={filmVersion}
          memberNumber={memberNumber}
          recordedAt={recordedAt}
        />
      ) : null}
    </>
  );
}
