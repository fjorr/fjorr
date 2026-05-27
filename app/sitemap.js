import { createClient } from '@supabase/supabase-js';

export default async function sitemap() {
  const baseUrl = 'https://fjorr.com';

  // 1. Define all your core static pages
  const staticRoutes = [
    '', 
    '/about', 
    '/contact', 
    '/nominate', 
    '/partner', 
    '/privacy', 
    '/terms', 
    '/search'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.6,
  }));

  // Create an internal server-side direct client handshake wrapper
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 2. Concurrently fetch all database rows for films and artifacts
  const [filmsResponse, artifactsResponse] = await Promise.all([
    supabase.from('film').select('slug, updated_at'),
    supabase.from('artifact').select('slug, updated_at')
  ]);

  // 3. Map out your short film profile page URLs
  const dynamicFilmRoutes = (filmsResponse.data || []).map((film) => ({
    url: `${baseUrl}/film/${film.slug}`,
    lastModified: film.updated_at ? new Date(film.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 4. Map out your custom streaming watch page URLs
  const dynamicWatchRoutes = (filmsResponse.data || []).map((film) => ({
    url: `${baseUrl}/watch/${film.slug}`,
    lastModified: film.updated_at ? new Date(film.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: 0.5, // Slightly lower index priority than the main info pages
  }));

  // 5. Map out your historical archive artifact URLs
  const dynamicArtifactRoutes = (artifactsResponse.data || []).map((art) => ({
    url: `${baseUrl}/artifact/${art.slug}`,
    lastModified: art.updated_at ? new Date(art.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Merge every route layer together into a clean, unified array
  return [
    ...staticRoutes, 
    ...dynamicFilmRoutes, 
    ...dynamicWatchRoutes, 
    ...dynamicArtifactRoutes
  ];
}