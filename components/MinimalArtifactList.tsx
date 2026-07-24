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
};

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
    <div className="w-full max-w-[600px] mx-auto flex flex-col divide-y divide-white/[0.06] px-8">
      {visible.map((item) => (
        <Link
          key={item.id}
          href={`/artifact/${item.slug}`}
          className="py-5 group flex flex-col gap-1"
        >
          <h2 className="font-sans font-bold text-[17px] text-white group-hover:opacity-80 transition-opacity">
            {item.name}
          </h2>
          {item.teaser && (
            <p className="font-sans text-[13px] text-white/50 leading-snug line-clamp-2">
              {item.teaser}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
