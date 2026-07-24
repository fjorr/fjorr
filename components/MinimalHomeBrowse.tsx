'use client';

import React from 'react';
import MinimalHomeList, { type MinimalFilm } from '@/components/MinimalHomeList';
import MinimalArtifactList, { type MinimalArtifact } from '@/components/MinimalArtifactList';
import { useMinimalFilter } from '@/components/MinimalFilterContext';

/** Shared shell so Film ↔ Artifact mini lists keep the same width and Y offset. */
export default function MinimalHomeBrowse({
  films,
  artifacts,
}: {
  films: MinimalFilm[];
  artifacts: MinimalArtifact[];
}) {
  const { contentType } = useMinimalFilter();

  return (
    <div className="w-full pb-8">
      <div className="w-full max-w-[600px] mx-auto px-5 pt-2 flex flex-col divide-y divide-white/[0.06]">
        {contentType === 'artifact' ? (
          <MinimalArtifactList artifacts={artifacts} />
        ) : (
          <MinimalHomeList films={films} />
        )}
      </div>
    </div>
  );
}
