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
  const { contentType, mix } = useMinimalFilter();

  return (
    <div className="w-full pb-8">
      <div
        className={`w-full max-w-[600px] mx-auto px-5 flex flex-col divide-y divide-page-faint ${
          mix === 'all' ? 'pt-2 mt-6 md:mt-8' : 'pt-0'
        }`}
      >
        {contentType === 'artifact' ? (
          <MinimalArtifactList artifacts={artifacts} />
        ) : (
          <MinimalHomeList films={films} />
        )}
      </div>
    </div>
  );
}
