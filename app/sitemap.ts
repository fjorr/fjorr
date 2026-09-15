import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { defaultLocale, locales, type AppLocale } from '@/i18n/config';
import { SITE_ORIGIN } from '@/lib/site';
import { filmVideoSitemapFields } from '@/lib/seo/video';

/** Next.js App Router — served at /sitemap.xml */
export const revalidate = 3600;

type FilmRow = {
  slug: string | null;
  name: string | null;
  teaser: string | null;
  runtime: number | null;
  release_date: string | null;
  mux_playback_id: string | null;
  blok_ogrf: string | null;
  updated_at: string | null;
};

type SlugRow = {
  slug: string | null;
  updated_at: string | null;
};

function lastMod(value: string | null | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function localizedPath(locale: AppLocale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return normalized === '/' ? '' : normalized;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

function entry(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  videos?: MetadataRoute.Sitemap[number]['videos']
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${SITE_ORIGIN}${localizedPath(locale, path) || ''}`;
  }
  languages['x-default'] = `${SITE_ORIGIN}${path === '/' ? '' : path}`;

  return {
    url: `${SITE_ORIGIN}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
    ...(videos?.length ? { videos } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    '/',
    '/about',
    '/about/the-mark',
    '/about/100-years-of-failure',
    '/bureaux',
    '/partner',
    '/subscribe',
    '/terms',
    '/privacy',
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) =>
    entry(
      path,
      new Date(),
      path === '/' ? 'daily' : 'monthly',
      path === '/' ? 1 : 0.6
    )
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('sitemap: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return staticRoutes;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [filmsResponse, artifactsResponse] = await Promise.all([
    supabase
      .from('film')
      .select(
        'slug, name, teaser, runtime, release_date, mux_playback_id, blok_ogrf, updated_at'
      )
      .not('slug', 'is', null),
    supabase.from('artifact').select('slug, updated_at').not('slug', 'is', null),
  ]);

  if (filmsResponse.error) {
    console.error('sitemap: film query failed', filmsResponse.error.message);
  }
  if (artifactsResponse.error) {
    console.error('sitemap: artifact query failed', artifactsResponse.error.message);
  }

  const now = Date.now();
  const filmRoutes: MetadataRoute.Sitemap = ((filmsResponse.data || []) as FilmRow[])
    .filter((film) => Boolean(film.slug))
    .filter((film) => {
      // Only released titles — coming-soon URLs stay out of the crawl graph.
      if (film.release_date == null) return false;
      const t = new Date(film.release_date).getTime();
      return !Number.isNaN(t) && t <= now;
    })
    .map((film) => {
      const slug = String(film.slug);
      const videos = film.name
        ? [
            filmVideoSitemapFields({
              name: film.name,
              description: film.teaser,
              slug,
              blokOgrf: film.blok_ogrf,
              muxPlaybackId: film.mux_playback_id,
              runtimeSeconds: film.runtime,
              publicationDate: film.release_date,
            }),
          ]
        : undefined;

      return entry(
        `/film/${slug}`,
        lastMod(film.updated_at || film.release_date),
        'weekly',
        0.8,
        videos
      );
    });

  const artifactRoutes: MetadataRoute.Sitemap = ((artifactsResponse.data || []) as SlugRow[])
    .filter((art) => Boolean(art.slug))
    .map((art) =>
      entry(
        `/artifact/${art.slug}`,
        lastMod(art.updated_at),
        'weekly',
        0.7
      )
    );

  return [...staticRoutes, ...filmRoutes, ...artifactRoutes];
}
