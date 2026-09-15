import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import HouseHome, { type HouseFilm } from '@/components/house/HouseHome';
import HomeFilmCrawlLinks from '@/components/HomeFilmCrawlLinks';
import { getHouseCarouselFilms } from '@/lib/content/home';
import { defaultLocale, type AppLocale } from '@/i18n/config';
import { SITE_ORIGIN, absoluteUrl } from '@/lib/site';
import { buildAlternates } from '@/lib/seo/alternates';

/** ISR — carousel data is also tagged (`film` / `home`) for on-demand bust. */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  return {
    alternates: buildAlternates('/', locale),
  };
}

function asText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }
  return null;
}

function formatLocation(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim() || null;
  if (Array.isArray(raw)) {
    const parts = raw.map((v) => String(v).trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

export default async function Home() {
  const locale = (await getLocale()) as AppLocale;
  const carousel = await getHouseCarouselFilms(locale);
  const films: HouseFilm[] = carousel.map((film) => ({
    id: String(film.id),
    name: film.name,
    slug: String(film.slug),
    mux_playback_id: film.mux_playback_id,
    hero_wide: film.hero_wide,
    hero_clsx: film.hero_clsx,
    hero_tall: film.hero_tall,
    blok_tall: film.blok_tall,
    blok_ogrf: film.blok_ogrf,
    teaser: film.teaser,
    story_date: asText(film.story_date),
    location: formatLocation(film.location),
    runtime: film.runtime,
    release_date: film.release_date,
    comingSoon:
      Boolean(film.comingSoon) ||
      (film.release_date ? new Date(film.release_date).getTime() > Date.now() : false),
    sponsor: asText(film.sponsor) || (typeof film.sponsor === 'string' ? film.sponsor : null),
    title_art_code: film.title_art_code,
    title_art_hex: film.title_art_hex,
    title_art_scale: film.title_art_scale,
    rating: asText(film.rating),
    theme: asText(film.theme),
  }));

  const crawlFilms = films
    .filter(
      (f): f is HouseFilm & { name: string; slug: string } =>
        Boolean(f.slug && f.name && !f.comingSoon)
    )
    .map((f) => ({ name: f.name, slug: String(f.slug) }));

  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: 'Fjorr',
        url: SITE_ORIGIN,
        description: "Short films of the world's greatest stories.",
        logo: absoluteUrl('/opengraph-image.png'),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'Fjorr',
        url: SITE_ORIGIN,
        description: "Short films of the world's greatest stories.",
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        inLanguage: locale === defaultLocale ? 'en' : locale,
      },
      ...(crawlFilms.length
        ? [
            {
              '@type': 'ItemList',
              '@id': `${SITE_ORIGIN}/#home-films`,
              name: 'Featured films',
              numberOfItems: crawlFilms.length,
              itemListElement: crawlFilms.map((film, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: absoluteUrl(`/film/${film.slug}`),
                name: film.name,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <h1 className="sr-only">Fjorr — short films of the world&apos;s greatest stories</h1>
      <HomeFilmCrawlLinks films={crawlFilms} />
      <HouseHome films={films} />
    </>
  );
}
