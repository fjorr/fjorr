import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import WatchClient from './WatchClient'; // ◄── This is import #1

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 🤖 DYNAMIC OPENGRAPH GENERATOR
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: urlSlug } = await params;
  const supabase = await createClient();

  const { data: film } = await supabase
    .from('film')
    .select('name, teaser, slug, blok_ogrf')
    .eq('slug', urlSlug)
    .maybeSingle();

  if (!film) return { title: 'Film Not Found' };

  const titleText = `Watching: ${film.name}`;
  const descriptionText = film.teaser || 'Watch this short film on Fjorr.';
  const ogImageUrl = film.blok_ogrf || 'https://fjorr.com/og-main-preview.jpg';

  return {
    title: titleText,
    description: descriptionText,
    openGraph: {
      title: `${titleText} | Fjorr`,
      description: descriptionText,
      url: `https://fjorr.com/watch/${film.slug}`,
      type: 'video.movie',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titleText} | Fjorr`,
      description: descriptionText,
      images: [ogImageUrl],
    },
  };
}

// 🚀 SERVER PAYLOAD FETCHING DISPATCHER
// 🎯 THE FIX: Changed this function name from WatchClient to WatchPage to kill the naming collision!
export default async function WatchPage({ params }: PageProps) {
  const { slug: urlSlug } = await params;
  const supabase = await createClient();

  const { data: film, error } = await supabase
    .from('film')
    .select(`
      id, 
      name, 
      slug, 
      mux_playback_id, 
      last_line,
      story_date,
      location,
      language_subtitle (
        vtt_url,
        language ( code, name )
      )
    `)
    .eq('slug', urlSlug)
    .maybeSingle();

  if (error || !film) {
    notFound();
  }

  // Pass the server data down safely to the imported WatchClient element
  return <WatchClient initialFilm={film} />;
}