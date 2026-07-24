import React from 'react';
import FeatureRailClient from './FeatureRailClient';
import { getFeaturedFilms } from '@/lib/content/home';

export default async function FeatureRailLoader() {
  const processedFilms = await getFeaturedFilms();
  if (processedFilms.length === 0) return null;
  return <FeatureRailClient films={processedFilms} />;
}
