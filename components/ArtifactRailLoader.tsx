import React from 'react';
import ArtifactRail from './ArtifactRail';
import { getArtifactRailItems } from '@/lib/content/home';
import { getLocale } from 'next-intl/server';
import { parseLocale } from '@/i18n/config';

interface ArtifactRailLoaderProps {
  title: string;
}

export default async function ArtifactRailLoader({ title }: ArtifactRailLoaderProps) {
  const locale = parseLocale(await getLocale());
  const artifacts = await getArtifactRailItems(locale);
  if (artifacts.length === 0) return null;
  return <ArtifactRail title={title} artifacts={artifacts} />;
}
