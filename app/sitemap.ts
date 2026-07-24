import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/nominate',
    '/partner',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: route ? `${SITE_ORIGIN}${route}` : SITE_ORIGIN,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : 0.6,
  }));

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
    supabase.from('film').select('slug, updated_at').not('slug', 'is', null),
    supabase.from('artifact').select('slug, updated_at').not('slug', 'is', null),
  ]);

  if (filmsResponse.error) {
    console.error('sitemap: film query failed', filmsResponse.error.message);
  }
  if (artifactsResponse.error) {
    console.error('sitemap: artifact query failed', artifactsResponse.error.message);
  }

  const filmRoutes: MetadataRoute.Sitemap = ((filmsResponse.data || []) as SlugRow[])
    .filter((film) => Boolean(film.slug))
    .map((film) => ({
      url: `${SITE_ORIGIN}/film/${film.slug}`,
      lastModified: lastMod(film.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const artifactRoutes: MetadataRoute.Sitemap = ((artifactsResponse.data || []) as SlugRow[])
    .filter((art) => Boolean(art.slug))
    .map((art) => ({
      url: `${SITE_ORIGIN}/artifact/${art.slug}`,
      lastModified: lastMod(art.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...staticRoutes, ...filmRoutes, ...artifactRoutes];
}
