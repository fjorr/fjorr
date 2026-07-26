import React from 'react';
import FeatureRailClient from './FeatureRailClient';
import { getFeaturedFilms } from '@/lib/content/home';
import { getLocale } from 'next-intl/server';
import { parseLocale } from '@/i18n/config';

export default async function FeatureRailLoader() {
  const locale = parseLocale(await getLocale());
  const processedFilms = await getFeaturedFilms(locale);
  if (processedFilms.length === 0) return null;
  return <FeatureRailClient films={processedFilms} />;
}
