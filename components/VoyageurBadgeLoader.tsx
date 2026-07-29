'use client';

import React, { useEffect, useState } from 'react';
import VoyageurBadge from '@/components/VoyageurBadge';
import {
  getOwnVoyageurStampForFilm,
  type VoyageurStamp,
} from '@/lib/film-record-actions';

/** Client fetch — keeps film page paint off the auth stamp query. */
export default function VoyageurBadgeLoader({ filmId }: { filmId: string }) {
  const [stamp, setStamp] = useState<VoyageurStamp | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOwnVoyageurStampForFilm(filmId).then((row) => {
      if (!cancelled) setStamp(row);
    });
    return () => {
      cancelled = true;
    };
  }, [filmId]);

  if (!stamp) return null;
  return <VoyageurBadge stamp={stamp} />;
}
