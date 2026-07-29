'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { absoluteUrl } from '@/lib/site';

/** Tiny share control for a Film Log Voyageur No. row. */
export default function FilmLogShareButton({
  filmName,
  filmSlug,
  viewerNumber,
}: {
  filmName: string;
  filmSlug: string;
  viewerNumber: number;
}) {
  const t = useTranslations('Film');
  const [copied, setCopied] = useState(false);

  const filmUrl = absoluteUrl(`/film/${filmSlug}`);
  const shareText = t('stampShareText', {
    number: viewerNumber,
    title: filmName,
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
      className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] text-white/35 hover:text-white/70 transition-colors"
      aria-label={t('stampShareCopy')}
    >
      {copied ? t('sendCopied') : t('stampShareShort')}
    </button>
  );
}
