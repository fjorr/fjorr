import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { defaultLocale, locales, type AppLocale } from '@/i18n/config';
import { SITE_ORIGIN } from '@/lib/site';

/** Next.js App Router — served at /sitemap.xml */
export const revalidate = 3600;

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
  priority: number
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
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    '/',
    '/about',
    '/principles',
    '/bounties',
    '/bureaux',
    '/plus',
    '/nominate',
    '/partner',
    '/privacy',
    '/terms',
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

  const [filmsResponse, artifactsResponse, bountiesResponse] = await Promise.all([
    supabase.from('film').select('slug, updated_at').not('slug', 'is', null),
    supabase.from('artifact').select('slug, updated_at').not('slug', 'is', null),
    supabase
      .from('bounties')
      .select('slug, updated_at')
      .eq('status', 'active')
      .not('slug', 'is', null),
  ]);

  if (filmsResponse.error) {
    console.error('sitemap: film query failed', filmsResponse.error.message);
  }
  if (artifactsResponse.error) {
    console.error('sitemap: artifact query failed', artifactsResponse.error.message);
  }
  if (bountiesResponse.error) {
    console.error('sitemap: bounties query failed', bountiesResponse.error.message);
  }

  const filmRoutes: MetadataRoute.Sitemap = ((filmsResponse.data || []) as SlugRow[])
    .filter((film) => Boolean(film.slug))
    .map((film) =>
      entry(
        `/film/${film.slug}`,
        lastMod(film.updated_at),
        'weekly',
        0.8
      )
    );

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

  const bountyRoutes: MetadataRoute.Sitemap = ((bountiesResponse.data || []) as SlugRow[])
    .filter((b) => Boolean(b.slug))
    .map((b) =>
      entry(`/bounties/${b.slug}`, lastMod(b.updated_at), 'weekly', 0.65)
    );

  return [...staticRoutes, ...filmRoutes, ...artifactRoutes, ...bountyRoutes];
}
