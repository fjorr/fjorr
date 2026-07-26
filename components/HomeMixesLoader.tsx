import { getHomeMixes } from '@/lib/content/home';
import HomeMixesSetter from '@/components/HomeMixesSetter';
import { getLocale } from 'next-intl/server';
import { parseLocale } from '@/i18n/config';

/** Streams mixes after the home shell so FeatureRail is not blocked. */
export default async function HomeMixesLoader() {
  const locale = parseLocale(await getLocale());
  const mixes = await getHomeMixes(locale);
  return <HomeMixesSetter mixes={mixes} />;
}
