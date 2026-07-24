import { createClient } from '@supabase/supabase-js';

export default async function sitemap() {
  const baseUrl = 'https://www.fjorr.com';

  const staticRoutes = [
    '',
    '/about',
    '/nominate',
    '/partner',
    '/privacy',
    '/terms',
    '/search',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.6,
  }));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [filmsResponse, artifactsResponse] = await Promise.all([
    supabase.from('film').select('slug, updated_at'),
    supabase.from('artifact').select('slug, updated_at'),
  ]);

  const dynamicFilmRoutes = (filmsResponse.data || []).map((film) => ({
    url: `${baseUrl}/film/${film.slug}`,
    lastModified: film.updated_at
      ? new Date(film.updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const dynamicArtifactRoutes = (artifactsResponse.data || []).map((art) => ({
    url: `${baseUrl}/artifact/${art.slug}`,
    lastModified: art.updated_at
      ? new Date(art.updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...dynamicFilmRoutes, ...dynamicArtifactRoutes];
}
