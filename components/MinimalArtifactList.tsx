'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useMinimalFilter } from '@/components/MinimalFilterContext';
import SearchNadaView from '@/components/SearchNadaView';

export type MinimalArtifact = {
  id: string;
  name: string;
  slug: string;
  teaser: string | null;
  created_at: string | null;
  /** Type of work — e.g. Book */
  label: string | null;
  creator: string | null;
  release_date: string | null;
};

function formatYear(releaseDate: string | null) {
  if (!releaseDate) return null;
  const year = new Date(releaseDate).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

function MetaLine({ item }: { item: MinimalArtifact }) {
  const parts = [item.label, item.creator, formatYear(item.release_date)].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <p className="font-sans text-[11px] font-medium capitalize tracking-normal text-white/30">
      {parts.join(' - ')}
    </p>
  );
}

export default function MinimalArtifactList({ artifacts }: { artifacts: MinimalArtifact[] }) {
  const { sort } = useMinimalFilter();

  const visible = useMemo(() => {
    const next = [...artifacts];
    if (sort === 'az') {
      next.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      next.sort((a, b) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
      });
    }
    return next;
  }, [artifacts, sort]);

  if (visible.length === 0) {
    return (
      <div className="flex w-full justify-center py-6">
        <SearchNadaView />
      </div>
    );
  }

  return (
    <>
      {visible.map((item) => (
        <div
          key={item.id}
          className="w-full flex items-center justify-between gap-8 py-4 first:pt-0 last:pb-0"
        >
          <Link
            href={`/artifact/${item.slug}`}
            className="min-w-0 flex-1 max-w-[380px] flex flex-col gap-1 pr-2 group"
          >
            <h2 className="font-sans text-[18px] font-bold tracking-tight text-white leading-tight group-hover:text-white/85 transition-colors">
              {item.name}
            </h2>
            {item.teaser && (
              <p className="font-sans text-[14px] font-normal text-white/70 leading-snug line-clamp-2">
                {item.teaser}
              </p>
            )}
            <MetaLine item={item} />
          </Link>
          {/* Match film list action column so text column stays put when toggling. */}
          <div className="shrink-0 w-[132px]" aria-hidden />
        </div>
      ))}
    </>
  );
}
