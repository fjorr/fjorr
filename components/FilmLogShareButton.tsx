'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { absoluteUrl } from '@/lib/site';
import { filmSharePath } from '@/lib/voyage-via';

/** Tiny share control for a Voyage row — link carries ?via=memberNumber. */
export default function FilmLogShareButton({
  filmName,
  filmSlug,
  viewerNumber,
  filmVersion = 1,
  memberNumber,
}: {
  filmName: string;
  filmSlug: string;
  viewerNumber: number;
  filmVersion?: number;
  memberNumber?: number | null;
}) {
  const t = useTranslations('Film');
  const [copied, setCopied] = useState(false);

  const filmUrl = absoluteUrl(
    filmSharePath({ slug: filmSlug, memberNumber })
  );
  const shareText = t('stampShareText', {
    number: viewerNumber,
    title: filmName,
    version: filmVersion,
  });
  const payload = `${shareText}\n${filmUrl}`;

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({
              title: filmName,
              text: shareText,
              url: filmUrl,
            });
            return;
          }
          await navigator.clipboard.writeText(payload);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          try {
            await navigator.clipboard.writeText(payload);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          } catch {
            /* ignore */
          }
        }
      }}
      className="shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-page-faint hover:text-page-muted transition-colors"
      aria-label={t('stampShareCopy')}
    >
      {copied ? t('sendCopied') : t('stampShareShort')}
    </button>
  );
}
