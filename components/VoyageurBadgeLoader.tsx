'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import VoyageurBadge from '@/components/VoyageurBadge';
import {
  getOwnVoyageurStampForFilm,
  type VoyageurStamp,
} from '@/lib/film-record-actions';

/** Client fetch — keeps film page paint off the auth stamp query. */
export default function VoyageurBadgeLoader({
  filmId,
  filmName,
  filmSlug,
  plusMember = false,
}: {
  filmId: string;
  filmName: string;
  filmSlug: string;
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
      <VoyageurBadge stamp={stamp} filmName={filmName} filmSlug={filmSlug} />
    );
  }

  // Members without a stamp claim it by watching — no empty ask.
  if (!ready || plusMember) return null;

  return (
    <p className="mt-6 mb-2 max-w-md font-sans text-[13px] leading-snug text-page-faint">
      {t('voyageurInvite')}{' '}
      <Link
        href="/bureaux"
        className="font-semibold text-page-muted underline underline-offset-4 decoration-[color-mix(in_srgb,var(--page-fg)_22%,transparent)] hover:text-page hover:decoration-[color-mix(in_srgb,var(--page-fg)_40%,transparent)] transition-colors"
      >
        {t('voyageurInviteCta')}
      </Link>
    </p>
  );
}
