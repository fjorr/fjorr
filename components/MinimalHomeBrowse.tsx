'use client';

import React from 'react';
import MinimalHomeList, { type MinimalFilm } from '@/components/MinimalHomeList';
import MinimalArtifactList, { type MinimalArtifact } from '@/components/MinimalArtifactList';
import { useMinimalFilter } from '@/components/MinimalFilterContext';

export default function MinimalHomeBrowse({
  films,
  artifacts,
}: {
  films: MinimalFilm[];
  artifacts: MinimalArtifact[];
}) {
  const { contentType } = useMinimalFilter();

  if (contentType === 'artifact') {
    return <MinimalArtifactList artifacts={artifacts} />;
  }

  return <MinimalHomeList films={films} />;
}
