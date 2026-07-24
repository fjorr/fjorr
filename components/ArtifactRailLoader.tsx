import React from 'react';
import ArtifactRail from './ArtifactRail';
import { getArtifactRailItems } from '@/lib/content/home';

interface ArtifactRailLoaderProps {
  title: string;
}

export default async function ArtifactRailLoader({ title }: ArtifactRailLoaderProps) {
  const artifacts = await getArtifactRailItems();
  if (artifacts.length === 0) return null;
  return <ArtifactRail title={title} artifacts={artifacts} />;
}
