'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import VoyageurBadge from '@/components/VoyageurBadge';
import VoyageurBadgeMark from '@/components/VoyageurBadgeMark';
import {
  getOwnVoyageurStampForFilm,
  type VoyageurStamp,
} from '@/lib/film-record-actions';

/** Client fetch — keeps film page paint off the auth stamp query. */
export default function VoyageurBadgeLoader({
  filmId,
  filmName,
  filmSlug,
  filmPoster = null,
  plusMember = false,
}: {
  filmId: string;
  filmName: string;
  filmSlug: string;
  filmPoster?: string | null;
  /** Active Bureaux — invite tease only for non-members without a stamp. */
  plusMember?: boolean;
}) {
  const t = useTranslations('Film');
  const [stamp, setStamp] = useState<VoyageurStamp | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void getOwnVoyageurStampForFilm(filmId).then((row) => {
      if (!cancelled) {
        setStamp(row);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [filmId]);

  if (!filmName || !filmSlug) return null;

  if (stamp) {
    return (
      <VoyageurBadge
        stamp={stamp}
        filmName={filmName}
        filmSlug={filmSlug}
        filmPoster={filmPoster}
      />
    );
  }

  // Members without a stamp claim it by watching — no empty ask.
  if (!ready || plusMember) return null;

  return (
    <Link
      href="/bureaux"
      className="mt-6 mb-2 inline-block max-w-full outline-none transition-opacity hover:opacity-90 focus-visible:rounded-[8px] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--page-fg)_28%,transparent)]"
      aria-label={`${t('voyageurBadgeTitleGhost')}. ${t('voyageurInviteCta')}`}
    >
      <VoyageurBadgeMark
        ghost
        filmName={filmName}
        filmPoster={filmPoster}
        footer={t('voyageurInviteCta')}
        tone="page"
      />
    </Link>
  );
}
